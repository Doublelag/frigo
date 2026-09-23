import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { esErrorDeModelo } from "./ai";
import { clientIp, limitRequest } from "./rate-limit";

/** Utilidades comunes de las rutas /api */

export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: jsonError("Petición no válida.", 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: jsonError("Faltan datos o no son válidos.", 400) };
  }
  return { ok: true, data: parsed.data };
}

export async function checkRate(req: Request, bucket: string, perHour: number): Promise<Response | null> {
  const res = await limitRequest(`frigo:${bucket}:${clientIp(req)}`, perHour, 60 * 60 * 1000);
  if (res.ok) return null;
  const min = Math.ceil(res.retryAfterSec / 60);
  return jsonError(`Has llegado al límite por ahora. Vuelve a probar en ${min} min.`, 429, {
    "Retry-After": String(res.retryAfterSec),
  });
}

export function claudeErrorResponse(error: unknown): Response {
  // Errores de contenido (respuesta ilegible, límite gratuito agotado...)
  if (esErrorDeModelo(error)) return jsonError((error as Error).message, 502);
  if (error instanceof Anthropic.RateLimitError) {
    return jsonError("Hay mucha gente usando Frigo ahora mismo. Prueba en un minuto.", 503);
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    console.error("[claude] API key no válida o sin permisos");
    return jsonError("El servicio no está bien configurado. Avisa al equipo de Frigo.", 500);
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error("[claude] petición rechazada:", error.message);
    return jsonError("No se ha podido procesar. Prueba con otra foto.", 400);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return jsonError("No hay conexión con el servicio. Prueba otra vez.", 503);
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`[claude] error ${error.status}:`, error.message);
    return jsonError("El servicio ha fallado. Prueba otra vez en un momento.", 502);
  }
  console.error("[api] error inesperado:", error);
  return jsonError("Algo ha ido mal. Prueba otra vez.", 500);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
