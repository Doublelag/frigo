/**
 * Límite de peticiones para que nadie se gaste el saldo de la API.
 *
 * Con las variables de Upstash configuradas, el contador es compartido por
 * todas las instancias del servidor (lo que hace falta en Vercel). Sin ellas,
 * cada instancia cuenta por su cuenta: vale para desarrollo, no para producción.
 */
export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return { ok: true };
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasSharedLimiter = () => Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/** Ventana fija en Redis: INCR y, la primera vez, caducidad de la clave */
async function upstashLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  const seconds = Math.ceil(windowMs / 1000);
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(seconds), "NX"],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);

  const [incr] = (await res.json()) as { result: number }[];
  const count = Number(incr?.result ?? 0);
  if (count > limit) return { ok: false, retryAfterSec: seconds };
  return { ok: true };
}

export async function limitRequest(key: string, limit: number, windowMs: number): Promise<RateResult> {
  if (hasSharedLimiter()) {
    try {
      return await upstashLimit(key, limit, windowMs);
    } catch (error) {
      // Si Redis falla, no dejamos a la gente sin app: se cuenta en memoria
      console.error("[rate-limit] Upstash no responde, se usa el contador local:", error);
    }
  }
  return rateLimit(key, limit, windowMs);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
