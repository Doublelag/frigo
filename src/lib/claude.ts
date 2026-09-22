import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { DETECT_SYSTEM, RECIPES_SYSTEM, TICKET_SYSTEM, detectUserText, recipesUserText } from "./prompts";
import { DetectionSchema, RecipesSchema, type DetectRequest, type RecipesRequest } from "./schemas";

/**
 * Todo lo que habla con Claude. Solo se usa en el servidor: la API key
 * nunca llega al móvil del usuario.
 */

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";

/** Sin API key la app funciona con datos de ejemplo */
export const isDemo = () => process.env.FRIGO_DEMO === "1" || !process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export class ClaudeOutputError extends Error {}

type Effort = "low" | "medium" | "high";

/**
 * JSON Schema para la salida estructurada, generado desde Zod. No usamos el
 * helper del SDK (betaZodOutputFormat) porque convierte los `enum` en simples
 * descripciones y entonces la API no los obliga a cumplirse.
 */
export function outputSchema(schema: z.ZodType): Record<string, unknown> {
  const json = normalizeTypes(z.toJSONSchema(schema, { target: "draft-2020-12" })) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/** `type: ["number", "null"]` → `anyOf`, que es la forma documentada para salida estructurada */
function normalizeTypes(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalizeTypes);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) out[key] = normalizeTypes(value);
  if (Array.isArray(out.type)) {
    const types = out.type as string[];
    delete out.type;
    out.anyOf = types.map((t) => ({ type: t }));
  }
  return out;
}

async function ask<S extends z.ZodType>(opts: {
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: S;
  effort: Effort;
}): Promise<z.infer<S>> {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Si Claude rechazara una petición, la API la reintenta sola con el modelo de respaldo
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort, format: { type: "json_schema", schema: outputSchema(opts.schema) } },
    system: opts.system,
    messages: [{ role: "user", content: opts.content }],
  });

  if (response.stop_reason === "refusal") {
    throw new ClaudeOutputError("Claude no ha podido procesar esta petición.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new ClaudeOutputError("La respuesta ha llegado incompleta. Prueba otra vez.");
  }

  const u = response.usage;
  console.info(`[claude] ${response.model} in=${u.input_tokens} out=${u.output_tokens}`);

  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  let data: unknown;
  try {
    data = JSON.parse(text ?? "");
  } catch {
    throw new ClaudeOutputError("La respuesta no se ha podido leer. Prueba otra vez.");
  }
  const parsed = opts.schema.safeParse(data);
  if (!parsed.success) {
    console.error("[claude] respuesta fuera de esquema:", parsed.error.message);
    throw new ClaudeOutputError("La respuesta no se ha podido leer. Prueba otra vez.");
  }
  return parsed.data;
}

export async function detectFoods({ images, today, source }: DetectRequest) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...images.map((img) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: img.media_type, data: img.data },
    })),
    { type: "text", text: detectUserText(today, images.length, source) },
  ];
  const result = await ask({
    system: source === "ticket" ? TICKET_SYSTEM : DETECT_SYSTEM,
    content,
    schema: DetectionSchema,
    effort: "medium",
  });
  return result.items;
}

export async function suggestRecipes(req: RecipesRequest, count = 4) {
  const text = recipesUserText({ ...req, count });
  const result = await ask({
    system: RECIPES_SYSTEM,
    content: [{ type: "text", text }],
    schema: RecipesSchema,
    effort: "medium",
  });
  return result.recipes;
}
