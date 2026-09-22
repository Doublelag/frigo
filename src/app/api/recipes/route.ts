import { checkRate, claudeErrorResponse, parseBody, sleep } from "@/lib/api-route";
import { isDemo, suggestRecipes } from "@/lib/claude";
import { DEMO_RECIPES } from "@/lib/demo";
import { RecipesRequestSchema } from "@/lib/schemas";

export const maxDuration = 120;

const PER_HOUR = Number(process.env.RATE_RECIPES_PER_HOUR ?? 30);

export async function POST(req: Request) {
  const limited = await checkRate(req, "recipes", PER_HOUR);
  if (limited) return limited;

  const body = await parseBody(req, RecipesRequestSchema);
  if (!body.ok) return body.response;

  if (isDemo()) {
    await sleep(1500);
    return Response.json({ recipes: DEMO_RECIPES, demo: true });
  }

  try {
    const recipes = await suggestRecipes(body.data);
    return Response.json({ recipes, demo: false });
  } catch (error) {
    return claudeErrorResponse(error);
  }
}
