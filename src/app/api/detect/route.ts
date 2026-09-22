import { checkRate, claudeErrorResponse, parseBody, sleep } from "@/lib/api-route";
import { detectFoods, isDemo } from "@/lib/claude";
import { DEMO_DETECTED } from "@/lib/demo";
import { DetectRequestSchema } from "@/lib/schemas";

export const maxDuration = 120;

const PER_HOUR = Number(process.env.RATE_DETECT_PER_HOUR ?? 20);

export async function POST(req: Request) {
  const limited = await checkRate(req, "detect", PER_HOUR);
  if (limited) return limited;

  const body = await parseBody(req, DetectRequestSchema);
  if (!body.ok) return body.response;

  if (isDemo()) {
    await sleep(1800);
    return Response.json({ items: DEMO_DETECTED, demo: true });
  }

  try {
    const items = await detectFoods(body.data);
    return Response.json({ items, demo: false });
  } catch (error) {
    return claudeErrorResponse(error);
  }
}
