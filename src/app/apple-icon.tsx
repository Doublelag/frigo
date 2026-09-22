import { ImageResponse } from "next/og";
import { AppIcon } from "@/components/AppIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS ya redondea las esquinas, así que se genera cuadrado
export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={180} maskable />, size);
}
