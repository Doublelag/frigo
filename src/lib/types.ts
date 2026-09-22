export const CATEGORIES = [
  "fruta",
  "verdura",
  "carne",
  "pescado",
  "lacteos",
  "huevos",
  "embutido",
  "sobras",
  "salsas",
  "bebidas",
  "otros",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  fruta: "Fruta",
  verdura: "Verdura",
  carne: "Carne",
  pescado: "Pescado",
  lacteos: "Lácteos",
  huevos: "Huevos",
  embutido: "Embutido y quesos",
  sobras: "Sobras y tápers",
  salsas: "Salsas y condimentos",
  bebidas: "Bebidas",
  otros: "Otros",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  fruta: "🍎",
  verdura: "🥬",
  carne: "🥩",
  pescado: "🐟",
  lacteos: "🥛",
  huevos: "🥚",
  embutido: "🧀",
  sobras: "🍱",
  salsas: "🫙",
  bebidas: "🧃",
  otros: "🛒",
};

export interface FridgeItem {
  id: string;
  name: string;
  emoji: string;
  category: Category;
  /** Texto libre: "3", "500 g", "medio paquete"... */
  quantity: string;
  /** Fecha yyyy-mm-dd o null si no se sabe */
  expiresAt: string | null;
  addedAt: string;
}

export type Confidence = "alta" | "media" | "baja";

/** Lo que devuelve /api/detect por cada alimento */
export interface DetectedItem {
  name: string;
  emoji: string;
  category: Category;
  quantity: string;
  days_left: number | null;
  expiry_source: "etiqueta" | "estimada";
  confidence: Confidence;
}

export type Diet = "omnivora" | "vegetariana" | "vegana" | "pescetariana";
export type Skill = "basico" | "medio" | "avanzado";

export interface Preferences {
  diet: Diet;
  allergies: string[];
  dislikes: string[];
  maxMinutes: number;
  servings: number;
  skill: Skill;
  /** Básicos que se dan por hechos: sal, aceite... */
  pantry: string[];
}

export type MealType = "cualquiera" | "desayuno" | "comida" | "cena" | "postre" | "picoteo";

export interface RecipeFilters {
  meal: MealType;
  maxMinutes: number;
  servings: number;
  /** Solo recetas que se pueden hacer sin comprar nada */
  onlyHave: boolean;
  /** Petición libre: "algo ligero", "para tupper"... */
  note: string;
}

export type IngredientStatus = "tengo" | "despensa" | "falta";

export interface RecipeIngredient {
  name: string;
  amount: string;
  status: IngredientStatus;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  description: string;
  minutes: number;
  difficulty: "fácil" | "media" | "difícil";
  servings: number;
  uses_expiring: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  tip: string;
  createdAt: string;
}

/** Motivo por el que un alimento sale de la nevera */
export type LogReason = "cocinado" | "tirado" | "quitado";

export interface LogEntry {
  date: string;
  name: string;
  reason: LogReason;
}

export interface ShoppingItem {
  id: string;
  name: string;
  note: string;
  checked: boolean;
}

/** Forma que se manda al servidor para pedir recetas */
export interface InventoryForPrompt {
  name: string;
  quantity: string;
  days_left: number | null;
}
