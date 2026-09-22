import { FRIDGE_ROWS } from "@/lib/sprites";

/**
 * Icono de la app en pixel art. Se dibuja con cajas porque ImageResponse
 * (satori) solo entiende flexbox, no SVG.
 */
const COLORS: Record<string, string> = {
  k: "#0c3722", // contorno
  w: "#ffffff", // cuerpo
  g: "#39a06a", // tiradores
};

export function AppIcon({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const grid = FRIDGE_ROWS.length;
  // Las maskable necesitan margen de seguridad: el sistema recorta los bordes
  const px = Math.floor((size * (maskable ? 0.62 : 0.82)) / grid);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#1d7a4c",
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
      }}
    >
      {FRIDGE_ROWS.map((row, y) => (
        <div key={y} style={{ display: "flex", height: px }}>
          {[...row].map((char, x) => (
            <div key={x} style={{ width: px, height: px, background: COLORS[char] ?? "transparent" }} />
          ))}
        </div>
      ))}
    </div>
  );
}
