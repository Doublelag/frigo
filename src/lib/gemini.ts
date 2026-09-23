import type { z } from "zod";
import { DETECT_SYSTEM, RECIPES_SYSTEM, TICKET_SYSTEM, detectUserText, recipesUserText } from "./prompts";
import { DetectionSchema, RecipesSchema, type DetectRequest, type RecipesRequest } from "./schemas";

/**
 * Alternativa gratuita: los modelos de Google tienen un nivel sin coste y la
 * clave se saca sin tarjeta. Se usa la API por HTTP, sin librerías.
 */
const MODEL = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
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

async function ask<S extends z.ZodType>(system: string, parts: Parte[], schema: S): Promise<z.infer<S>> {
  const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GOOGLE_API_KEY! },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    console.error(`[gemini] ${res.status}: ${detalle.slice(0, 300)}`);
    if (res.status === 429) throw new GeminiOutputError("Se ha agotado el límite gratuito por hoy. Prueba mañana.");
    if (res.status === 400 || res.status === 403) {
      throw new GeminiOutputError("La clave de Google no es válida o no tiene permisos.");
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

  const parsed = schema.safeParse(json);
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
  const result = await ask(source === "ticket" ? TICKET_SYSTEM : DETECT_SYSTEM, parts, DetectionSchema);
  return result.items;
}

export async function suggestRecipesGoogle(req: RecipesRequest, count = 4) {
  const parts: Parte[] = [{ text: `${recipesUserText({ ...req, count })}\n\n${FORMA_RECETAS}` }];
  const result = await ask(RECIPES_SYSTEM, parts, RecipesSchema);
  return result.recipes;
}
