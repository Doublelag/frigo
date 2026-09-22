import { z } from "zod";
import { COOKIE, COOKIE_DAYS, accessRequired, accessToken, isValidCode } from "@/lib/access";
import { checkRate, jsonError, parseBody, sleep } from "@/lib/api-route";

const BodySchema = z.object({ code: z.string().min(1).max(100) });

export async function POST(req: Request) {
  if (!accessRequired()) return Response.json({ ok: true });

  // Sin esto se podría probar el código a lo bruto
  const limited = await checkRate(req, "acceso", 30);
  if (limited) return limited;

  const body = await parseBody(req, BodySchema);
  if (!body.ok) return body.response;

  if (!isValidCode(body.data.code)) {
    await sleep(600);
    return jsonError("Ese código no es.", 401);
  }

  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    [
      `${COOKIE}=${accessToken()}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${COOKIE_DAYS * 24 * 60 * 60}`,
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
  return res;
}
