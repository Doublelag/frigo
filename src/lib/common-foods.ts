import type { Category } from "./types";

/**
 * Lo típico de una nevera española, para añadirlo de un toque sin escribir.
 * `days` es la duración habitual en nevera desde que se compra.
 */
export interface CommonFood {
  name: string;
  emoji: string;
  category: Category;
  days: number;
}

export const COMMON_FOODS: CommonFood[] = [
  { name: "huevos", emoji: "🥚", category: "huevos", days: 21 },
  { name: "leche", emoji: "🥛", category: "lacteos", days: 7 },
  { name: "yogur", emoji: "🥣", category: "lacteos", days: 14 },
  { name: "queso", emoji: "🧀", category: "embutido", days: 14 },
  { name: "mantequilla", emoji: "🧈", category: "lacteos", days: 30 },
  { name: "jamón york", emoji: "🍖", category: "embutido", days: 7 },
  { name: "jamón serrano", emoji: "🥓", category: "embutido", days: 20 },
  { name: "pechuga de pollo", emoji: "🍗", category: "carne", days: 2 },
  { name: "carne picada", emoji: "🥩", category: "carne", days: 2 },
  { name: "salmón", emoji: "🐟", category: "pescado", days: 2 },
  { name: "tomate", emoji: "🍅", category: "verdura", days: 7 },
  { name: "lechuga", emoji: "🥬", category: "verdura", days: 5 },
  { name: "cebolla", emoji: "🧅", category: "verdura", days: 30 },
  { name: "pimiento", emoji: "🫑", category: "verdura", days: 7 },
  { name: "calabacín", emoji: "🥒", category: "verdura", days: 7 },
  { name: "zanahoria", emoji: "🥕", category: "verdura", days: 14 },
  { name: "patata", emoji: "🥔", category: "verdura", days: 30 },
  { name: "champiñones", emoji: "🍄", category: "verdura", days: 5 },
  { name: "limón", emoji: "🍋", category: "fruta", days: 14 },
  { name: "manzana", emoji: "🍎", category: "fruta", days: 14 },
  { name: "plátano", emoji: "🍌", category: "fruta", days: 5 },
  { name: "naranja", emoji: "🍊", category: "fruta", days: 14 },
  { name: "pan", emoji: "🍞", category: "otros", days: 3 },
  { name: "tomate frito", emoji: "🥫", category: "salsas", days: 5 },
  { name: "nata", emoji: "🥛", category: "lacteos", days: 7 },
  { name: "cerveza", emoji: "🍺", category: "bebidas", days: 180 },
];
