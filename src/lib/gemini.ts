import type { z } from "zod";
import { DETECT_SYSTEM, RECIPES_SYSTEM, TICKET_SYSTEM, detectUserText, recipesUserText } from "./prompts";
import { DetectionSchema, RecipesSchema, type DetectRequest, type RecipesRequest } from "./schemas";
import { CATEGORIES } from "./types";

/**
 * Alternativa gratuita: los modelos de Google tienen un nivel sin coste y la
 * clave se saca sin tarjeta. Se usa la API por HTTP, sin librerías.
 */
/**
 * El nivel gratuito se satura a ratos (503). En vez de rendirse, se prueba el
 * siguiente modelo de la lista: todos valen para mirar fotos.
 */
const CALIDAD = [
  process.env.GOOGLE_MODEL,
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
].filter(Boolean) as string[];

/** Los grandes están casi siempre llenos; el ligero responde y para leer un ticket sobra */
const RAPIDO = ["gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-3.6-flash"];
// GOOGLE_ENDPOINT solo se usa para probar contra un servidor falso
const ENDPOINT = process.env.GOOGLE_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta/models";

export const hasGoogleKey = () => Boolean(process.env.GOOGLE_API_KEY);

export class GeminiOutputError extends Error {}

/** Google no acepta el JSON Schema de Zod tal cual: se le explica la forma en el propio texto */
const FORMA_DETECCION = `Responde SOLO con un objeto JSON, sin texto alrededor ni bloques de código, con esta forma exacta:
{"items":[{"name":"string en minúscula","emoji":"un emoji","category":"fruta|verdura|carne|pescado|lacteos|huevos|embutido|sobras|salsas|bebidas|otros","quantity":"string","days_left":número o null,"expiry_source":"etiqueta|estimada","confidence":"alta|media|baja"}]}`;

const FORMA_RECETAS = `Responde SOLO con un objeto JSON, sin texto alrededor ni bloques de código, con esta forma exacta:
{"recipes":[{"title":"string","emoji":"un emoji","description":"string","minutes":número,"difficulty":"fácil|media|difícil","servings":número,"uses_expiring":["string"],"ingredients":[{"name":"string","amount":"string","status":"tengo|despensa|falta"}],"steps":["string"],"tip":"string"}]}`;

interface Parte {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** Elige el valor válido más parecido; si no hay, el de por defecto */
function opcion<T extends string>(valor: unknown, validos: readonly T[], porDefecto: T): T {
  const v = sinTildes(String(valor ?? ""));
  return validos.find((x) => sinTildes(x) === v) ?? porDefecto;
}

function numeroONull(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Los modelos pequeños se saltan detalles del formato: a veces devuelven la
 * lista pelada, o la categoría con tilde, o los días como texto. En vez de
 * fallar, se ordena lo que llega y luego ya valida Zod.
 */
export function sanear(json: unknown, clave: "items" | "recipes"): unknown {
  const lista = Array.isArray(json)
    ? json
    : ((json as Record<string, unknown>)?.[clave] ??
      (json as Record<string, unknown>)?.productos ??
      (json as Record<string, unknown>)?.alimentos ??
      (json as Record<string, unknown>)?.recetas ??
      []);
  const filas = (Array.isArray(lista) ? lista : []) as Record<string, unknown>[];

  if (clave === "items") {
    return {
      items: filas.map((f) => ({
        name: String(f.name ?? "").trim(),
        emoji: String(f.emoji ?? "🛒").trim() || "🛒",
        category: opcion(f.category, CATEGORIES, "otros"),
        quantity: String(f.quantity ?? "").trim(),
        days_left: numeroONull(f.days_left),
        expiry_source: opcion(f.expiry_source, ["etiqueta", "estimada"] as const, "estimada"),
        confidence: opcion(f.confidence, ["alta", "media", "baja"] as const, "media"),
      })),
    };
  }

  return {
    recipes: filas.map((f) => ({
      title: String(f.title ?? "").trim(),
      emoji: String(f.emoji ?? "🍽️").trim() || "🍽️",
      description: String(f.description ?? "").trim(),
      minutes: numeroONull(f.minutes) ?? 30,
      difficulty: opcion(f.difficulty, ["fácil", "media", "difícil"] as const, "media"),
      servings: numeroONull(f.servings) ?? 2,
      uses_expiring: Array.isArray(f.uses_expiring) ? f.uses_expiring.map(String) : [],
      ingredients: (Array.isArray(f.ingredients) ? f.ingredients : []).map((i) => {
        const ing = i as Record<string, unknown>;
        return {
          name: String(ing.name ?? "").trim(),
          amount: String(ing.amount ?? "").trim(),
          status: opcion(ing.status, ["tengo", "despensa", "falta"] as const, "falta"),
        };
      }),
      steps: (Array.isArray(f.steps) ? f.steps : []).map(String),
      tip: String(f.tip ?? ""),
    })),
  };
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const saturado = (status: number) => status === 503 || status === 500 || status === 502 || status === 429;

/** Recorre la cadena de modelos hasta que uno responda */
async function llamar(system: string, parts: Parte[], cadena: string[]): Promise<Response> {
  const cuerpo = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 8192 },
  });

  const pedir = (modelo: string) =>
    fetch(`${ENDPOINT}/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GOOGLE_API_KEY! },
      body: cuerpo,
    });

  let ultima: Response | null = null;
  for (const modelo of cadena) {
    const res = await pedir(modelo);
    if (res.ok) {
      if (modelo !== cadena[0]) console.info(`[gemini] ha respondido ${modelo}`);
      return res;
    }
    // Saturado: se prueba el siguiente. Cualquier otro error, se devuelve tal cual
    if (!saturado(res.status)) return res;
    console.warn(`[gemini] ${modelo} devuelve ${res.status}`);
    ultima = res;
  }

  // Último cartucho: el ligero otra vez, tras una pausa
  await espera(1500);
  const reintento = await pedir(cadena[cadena.length - 1]);
  return reintento.ok ? reintento : (ultima ?? reintento);
}

async function ask<S extends z.ZodType>(
  system: string,
  parts: Parte[],
  schema: S,
  clave: "items" | "recipes",
  cadena: string[] = CALIDAD,
): Promise<z.infer<S>> {
  const res = await llamar(system, parts, cadena);

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    console.error(`[gemini] ${res.status}: ${detalle.slice(0, 300)}`);
    if (res.status === 429) throw new GeminiOutputError("Se ha agotado el límite gratuito por hoy. Prueba mañana.");
    if (res.status === 400 || res.status === 403) {
      throw new GeminiOutputError("La clave de Google no es válida o no tiene permisos.");
    }
    if (res.status === 503) {
      throw new GeminiOutputError("Google está saturado ahora mismo. Prueba en un minuto.");
    }
    throw new GeminiOutputError("El servicio de Google ha fallado. Prueba otra vez.");
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const texto = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!texto) throw new GeminiOutputError("La respuesta ha llegado vacía. Prueba otra vez.");

  let json: unknown;
  try {
    // A veces envuelve el JSON en ```json ... ```
    json = JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  } catch {
    throw new GeminiOutputError("La respuesta no se ha podido leer. Prueba otra vez.");
  }

  const parsed = schema.safeParse(sanear(json, clave));
  if (!parsed.success) {
    console.error("[gemini] respuesta fuera de esquema:", parsed.error.message.slice(0, 300));
    throw new GeminiOutputError("La respuesta no se ha podido leer. Prueba otra vez.");
  }
  return parsed.data;
}

export async function detectFoodsGoogle({ images, today, source }: DetectRequest) {
  const parts: Parte[] = [
    ...images.map((img) => ({ inline_data: { mime_type: img.media_type, data: img.data } })),
    { text: `${detectUserText(today, images.length, source)}\n\n${FORMA_DETECCION}` },
  ];
  const result = await ask(
    source === "ticket" ? TICKET_SYSTEM : DETECT_SYSTEM,
    parts,
    DetectionSchema,
    "items",
    // Un ticket es leer texto: con el modelo ligero basta y además está libre
    source === "ticket" ? RAPIDO : CALIDAD,
  );
  return result.items;
}

export async function suggestRecipesGoogle(req: RecipesRequest, count = 4) {
  const parts: Parte[] = [{ text: `${recipesUserText({ ...req, count })}\n\n${FORMA_RECETAS}` }];
  const result = await ask(RECIPES_SYSTEM, parts, RecipesSchema, "recipes");
  return result.recipes;
}
