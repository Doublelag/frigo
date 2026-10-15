/**
 * TEMPORAL (diagnóstico): lista qué modelos de Google admite la clave,
 * para elegir a cuál caer cuando el principal está saturado.
 */
export async function GET() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return Response.json({ error: "sin clave" }, { status: 400 });

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", {
    headers: { "x-goog-api-key": key },
  });
  if (!res.ok) return Response.json({ error: res.status, detalle: await res.text() }, { status: 502 });

  const data = (await res.json()) as {
    models?: { name: string; supportedGenerationMethods?: string[]; inputTokenLimit?: number }[];
  };
  const modelos = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace("models/", ""));

  return Response.json({ modelos }, { headers: { "Cache-Control": "no-store" } });
}
