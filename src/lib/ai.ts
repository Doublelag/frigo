import { ClaudeOutputError, detectFoods, hasClaudeKey, suggestRecipes } from "./claude";
import { GeminiOutputError, detectFoodsGoogle, hasGoogleKey, suggestRecipesGoogle } from "./gemini";
import type { DetectRequest, RecipesRequest } from "./schemas";

/**
 * Decide quién mira las fotos. Claude si hay clave suya (mejor calidad);
 * si no, Google, que tiene nivel gratuito. Sin ninguna de las dos, la app
 * responde con datos de ejemplo.
 */
export type Provider = "claude" | "google" | "demo";

export function provider(): Provider {
  if (process.env.FRIGO_DEMO === "1") return "demo";
  if (hasClaudeKey()) return "claude";
  if (hasGoogleKey()) return "google";
  return "demo";
}

export const isDemo = () => provider() === "demo";

/** Errores "de contenido": se le enseñan al usuario tal cual */
export const esErrorDeModelo = (e: unknown) => e instanceof ClaudeOutputError || e instanceof GeminiOutputError;

export const detectar = (req: DetectRequest) => (provider() === "google" ? detectFoodsGoogle(req) : detectFoods(req));

export const proponerRecetas = (req: RecipesRequest) =>
  provider() === "google" ? suggestRecipesGoogle(req) : suggestRecipes(req);
