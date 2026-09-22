import { ImageResponse } from "next/og";
import { AppIcon } from "@/components/AppIcon";

// /icons/192, /icons/512, /icons/maskable-512
const ICONS: Record<string, { size: number; maskable: boolean }> = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "maskable-512": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_req: Request, ctx: RouteContext<"/icons/[name]">) {
  const { name } = await ctx.params;
  const icon = ICONS[name];
  if (!icon) return new Response("Not found", { status: 404 });
  return new ImageResponse(<AppIcon size={icon.size} maskable={icon.maskable} />, {
    width: icon.size,
    height: icon.size,
  });
}
