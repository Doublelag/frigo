import { isDemo, provider } from "@/lib/ai";

/** Para que la app sepa si está conectada a un modelo o dando datos de ejemplo */
export async function GET() {
  return Response.json({ demo: isDemo(), provider: provider() }, { headers: { "Cache-Control": "no-store" } });
}
