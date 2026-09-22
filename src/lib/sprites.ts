/**
 * Sprites de pixel art dibujados a mano, 16x16.
 * Cada letra es un color del `palette`; el punto es transparente.
 */
export type Sprite = { rows: string[]; palette: Record<string, string> };

/**
 * Paleta fija tipo consola retro: los mismos colores en claro y oscuro, así
 * los dibujos se leen igual sobre cualquier fondo (como el icono de la app).
 */
const THEME = {
  k: "#0c3722", // contorno
  w: "#f4f1e6", // cuerpo claro
  g: "#39a06a", // verde de la marca
  y: "#f0b429", // amarillo
  s: "#8a9490", // gris
} as const;

export const FRIDGE_ROWS = [
  "................",
  "...kkkkkkkkkk...",
  "...kwwwwwwwwk...",
  "...kwwwwwwgwk...",
  "...kwwwwwwgwk...",
  "...kkkkkkkkkk...",
  "...kwwwwwwwwk...",
  "...kwwwwwwgwk...",
  "...kwwwwwwgwk...",
  "...kwwwwwwwwk...",
  "...kwwwwwwwwk...",
  "...kwwwwwwwwk...",
  "...kwwwwwwwwk...",
  "...kwwwwwwwwk...",
  "...kkkkkkkkkk...",
  "....k......k....",
];

export const SPRITES: Record<string, Sprite> = {
  fridge: { rows: FRIDGE_ROWS, palette: THEME },

  hat: {
    rows: [
      "................",
      "................",
      "....kkkkkkk.....",
      "..kkwwwwwwwkk...",
      ".kwwwwwwwwwwwk..",
      ".kwwwwwwwwwwwk..",
      ".kwwwwwwwwwwwk..",
      "..kwwwwwwwwwk...",
      "...kkkkkkkkk....",
      "...kwwwwwwwk....",
      "...kwgwgwgwk....",
      "...kwwwwwwwk....",
      "...kkkkkkkkk....",
      "................",
      "................",
      "................",
    ],
    palette: THEME,
  },

  basket: {
    rows: [
      "................",
      "................",
      "................",
      "....kk...kk.....",
      "...kwwk.kwwk....",
      "...kwwkkkwwk....",
      "..kkkkkkkkkkk...",
      "..kggggggggwk...",
      "..kgkgkgkgkgk...",
      "..kggggggggwk...",
      "...kgkgkgkgk....",
      "...kgggggggk....",
      "....kkkkkkk.....",
      "................",
      "................",
      "................",
    ],
    palette: THEME,
  },

  camera: {
    rows: [
      "................",
      "................",
      "................",
      ".....kkkk.......",
      "...kkkwwkkkkkk..",
      "..kwwwwwwwwwwwk.",
      "..kwkkkkkkkwgwk.",
      "..kwkssssskwwwk.",
      "..kwkswwwskwwwk.",
      "..kwkswwwskwwwk.",
      "..kwkssssskwwwk.",
      "..kwkkkkkkkwwwk.",
      "..kwwwwwwwwwwwk.",
      "..kkkkkkkkkkkkk.",
      "................",
      "................",
    ],
    palette: THEME,
  },

  clock: {
    rows: [
      "................",
      "................",
      "....kkkkkkk.....",
      "..kkwwwwwwwkk...",
      "..kwwwwkwwwwk...",
      ".kwwwwwkwwwwwk..",
      ".kwwwwwkwwwwwk..",
      ".kwwwwwkkkwwwk..",
      ".kwwwwwwwwwwwk..",
      ".kwwwwwwwwwwwk..",
      "..kwwwwwwwwwk...",
      "..kkwwwwwwwkk...",
      "....kkkkkkk.....",
      "................",
      "................",
      "................",
    ],
    palette: { ...THEME, k: "var(--warn)", w: "var(--warn-soft)" },
  },
};
