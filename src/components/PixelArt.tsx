import { SPRITES } from "@/lib/sprites";

/**
 * Marco tipo pantalla de consola: fondo claro fijo en claro y en oscuro, para
 * que el contorno del pixel art siempre se vea.
 */
export function PixelScreen({
  sprite,
  size = 88,
  className = "",
}: {
  sprite: keyof typeof SPRITES;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl border-4 border-[#0c3722] bg-[#cfe3d2] p-2 ${className}`}
    >
      <PixelArt sprite={sprite} size={size} />
    </span>
  );
}

/** Dibuja un sprite de 16x16 como SVG: escala sin perder el borde duro del pixel art. */
export function PixelArt({
  sprite,
  size = 96,
  className = "",
}: {
  sprite: keyof typeof SPRITES;
  size?: number;
  className?: string;
}) {
  const { rows, palette } = SPRITES[sprite];
  const width = rows[0].length;

  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      {rows.map((row, y) =>
        [...row].map((char, x) =>
          char === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[char] ?? "currentColor"} />
          ),
        ),
      )}
    </svg>
  );
}
