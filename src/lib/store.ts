"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { addDays, todayISO } from "./dates";
import { DEFAULT_THEME, STORAGE_KEY, type Theme } from "./theme";
import type {
  DetectedItem,
  FridgeItem,
  IngredientStatus,
  LogEntry,
  LogReason,
  Preferences,
  Recipe,
  RecipeFilters,
  RecipeIngredient,
  ShoppingItem,
} from "./types";

export const DEFAULT_PREFS: Preferences = {
  diet: "omnivora",
  allergies: [],
  dislikes: [],
  maxMinutes: 30,
  servings: 2,
  skill: "medio",
  pantry: ["sal", "aceite de oliva", "pimienta", "ajo", "harina", "azúcar", "vinagre"],
};

export const DEFAULT_FILTERS: RecipeFilters = {
  meal: "cualquiera",
  maxMinutes: DEFAULT_PREFS.maxMinutes,
  servings: DEFAULT_PREFS.servings,
  onlyHave: false,
  note: "",
};

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Para comparar nombres: minúsculas y sin tildes */
export function normalizeName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/** "huevos" y "huevo" son lo mismo; "los tomates" y "tomate", también */
const FILLER = new Set(["de", "del", "la", "el", "los", "las", "un", "una", "y", "en"]);

/**
 * Raíz aproximada de la palabra. En castellano el plural añade "s" tras vocal
 * (tomate→tomates) y "es" tras consonante (limón→limones), así que quitamos la
 * "s" final y luego la "e": las dos formas acaban en la misma raíz.
 */
function stem(word: string): string {
  let w = word;
  if (w.length > 3 && w.endsWith("s")) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

/** Clave para comparar alimentos entre nevera, recetas y lista de la compra */
export function foodKey(name: string): string {
  return normalizeName(name)
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w))
    .map(stem)
    .join(" ");
}

/**
 * Guardar en el móvil puede fallar (modo privado de Safari, almacenamiento
 * lleno, cookies bloqueadas). En ese caso la app funciona igual, solo que los
 * datos no sobreviven al cierre.
 */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      console.warn("[frigo] no se han podido guardar los datos en este navegador");
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Nada que hacer
    }
  },
};

/** Une lo guardado en el móvil con los valores por defecto de esta versión */
export function mergePersisted<T extends object>(persisted: unknown, current: T): T {
  const saved = (persisted ?? {}) as Partial<FrigoState>;
  return {
    ...current,
    ...saved,
    prefs: { ...DEFAULT_PREFS, ...(saved.prefs ?? {}) },
    filters: { ...DEFAULT_FILTERS, ...(saved.filters ?? {}) },
    theme: saved.theme ?? DEFAULT_THEME,
    log: saved.log ?? [],
  };
}

interface FrigoState {
  items: FridgeItem[];
  shopping: ShoppingItem[];
  prefs: Preferences;
  filters: RecipeFilters;
  recipes: Recipe[];
  saved: Recipe[];
  onboarded: boolean;
  theme: Theme;
  /** Qué se ha aprovechado y qué se ha tirado, para las estadísticas */
  log: LogEntry[];

  setTheme: (theme: Theme) => void;
  addDetected: (detected: DetectedItem[]) => void;
  upsertItem: (item: Omit<FridgeItem, "id" | "addedAt"> & { id?: string }) => void;
  /** Quita alimentos y devuelve los quitados, para poder deshacer */
  removeItems: (ids: string[], reason?: LogReason) => FridgeItem[];
  restoreItems: (items: FridgeItem[]) => void;

  addShopping: (names: { name: string; note?: string }[]) => number;
  toggleShopping: (id: string) => void;
  removeShopping: (id: string) => void;
  clearCheckedShopping: () => void;

  setPrefs: (prefs: Partial<Preferences>) => void;
  setFilters: (filters: Partial<RecipeFilters>) => void;
  adjustServings: (delta: number) => void;
  setRecipes: (recipes: Recipe[]) => void;
  toggleSaved: (recipe: Recipe) => void;
  finishOnboarding: () => void;
  resetAll: () => void;
}

export const useFrigo = create<FrigoState>()(
  persist(
    (set, get) => ({
      items: [],
      shopping: [],
      prefs: DEFAULT_PREFS,
      filters: DEFAULT_FILTERS,
      recipes: [],
      saved: [],
      onboarded: false,
      theme: DEFAULT_THEME,
      log: [],

      setTheme: (theme) => set({ theme }),

      addDetected: (detected) =>
        set((state) => {
          const items = [...state.items];
          for (const d of detected) {
            const expiresAt = d.days_left === null ? null : addDays(d.days_left);
            const idx = items.findIndex((i) => foodKey(i.name) === foodKey(d.name));
            if (idx >= 0) {
              // Ya estaba: se actualiza con lo último que se ha visto
              items[idx] = { ...items[idx], quantity: d.quantity, expiresAt, emoji: d.emoji };
            } else {
              items.push({
                id: uid(),
                name: d.name,
                emoji: d.emoji,
                category: d.category,
                quantity: d.quantity,
                expiresAt,
                addedAt: todayISO(),
              });
            }
          }
          return { items };
        }),

      upsertItem: (item) =>
        set((state) => {
          if (item.id) {
            return {
              items: state.items.map((i) => (i.id === item.id ? { ...i, ...item, id: i.id } : i)),
            };
          }
          // Añadido a mano: si ya está en la nevera se actualiza, no se duplica
          const existing = state.items.find((i) => foodKey(i.name) === foodKey(item.name));
          if (existing) {
            return { items: state.items.map((i) => (i.id === existing.id ? { ...i, ...item, id: i.id } : i)) };
          }
          return { items: [...state.items, { ...item, id: uid(), addedAt: todayISO() }] };
        }),

      removeItems: (ids, reason = "quitado") => {
        const removed = get().items.filter((i) => ids.includes(i.id));
        const entries: LogEntry[] = removed.map((i) => ({ date: todayISO(), name: i.name, reason }));
        set((state) => ({
          items: state.items.filter((i) => !ids.includes(i.id)),
          // Solo interesa el historial reciente: se guardan las últimas 300
          log: [...state.log, ...entries].slice(-300),
        }));
        return removed;
      },

      /** Deshacer: vuelve a meter lo quitado y borra su rastro del historial */
      restoreItems: (restored) =>
        set((state) => {
          const ids = new Set(restored.map((i) => i.id));
          const names = new Set(restored.map((i) => i.name));
          const log = [...state.log];
          for (let i = log.length - 1; i >= 0 && names.size; i--) {
            if (names.has(log[i].name)) {
              names.delete(log[i].name);
              log.splice(i, 1);
            }
          }
          return { items: [...state.items.filter((i) => !ids.has(i.id)), ...restored], log };
        }),

      addShopping: (entries) => {
        const existing = new Set(
          get()
            .shopping.filter((s) => !s.checked)
            .map((s) => foodKey(s.name)),
        );
        const fresh = entries
          .filter((e) => {
            const key = foodKey(e.name);
            // También filtra repetidos dentro de la misma tanda
            if (!e.name.trim() || !key || existing.has(key)) return false;
            existing.add(key);
            return true;
          })
          .map((e) => ({ id: uid(), name: e.name.trim(), note: e.note ?? "", checked: false }));
        set((state) => ({ shopping: [...state.shopping, ...fresh] }));
        return fresh.length;
      },

      toggleShopping: (id) =>
        set((state) => ({
          shopping: state.shopping.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)),
        })),

      removeShopping: (id) => set((state) => ({ shopping: state.shopping.filter((s) => s.id !== id) })),

      clearCheckedShopping: () => set((state) => ({ shopping: state.shopping.filter((s) => !s.checked) })),

      setPrefs: (prefs) => set((state) => ({ prefs: { ...state.prefs, ...prefs } })),
      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

      /** Sube o baja raciones sin perder pulsaciones rápidas */
      adjustServings: (delta) =>
        set((state) => ({
          filters: { ...state.filters, servings: Math.min(12, Math.max(1, state.filters.servings + delta)) },
        })),
      setRecipes: (recipes) => set({ recipes }),

      toggleSaved: (recipe) =>
        set((state) =>
          state.saved.some((r) => r.id === recipe.id)
            ? { saved: state.saved.filter((r) => r.id !== recipe.id) }
            : { saved: [recipe, ...state.saved] },
        ),

      finishOnboarding: () => set({ onboarded: true }),

      resetAll: () =>
        set({
          items: [],
          shopping: [],
          prefs: DEFAULT_PREFS,
          filters: DEFAULT_FILTERS,
          recipes: [],
          saved: [],
          onboarded: false,
          log: [],
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Sin esto, al añadir un ajuste nuevo en una versión futura los móviles
      // que ya tienen datos se quedarían sin él
      merge: (persisted, current) => mergePersisted(persisted, current),
    },
  ),
);

/**
 * ¿Este ingrediente de receta corresponde a algo de la nevera?
 * "pollo" ~ "pechuga de pollo" (una es parte de la otra), pero "leche" no es
 * "lechuga": se comparan palabras enteras, no trozos.
 */
export function sameFood(a: string, b: string): boolean {
  const x = foodKey(a).split(" ").filter(Boolean);
  const y = foodKey(b).split(" ").filter(Boolean);
  if (!x.length || !y.length) return false;
  const [corta, larga] = x.length <= y.length ? [x, y] : [y, x];
  return corta.every((word) => larga.includes(word));
}

/**
 * Estado actual de un ingrediente: la receta pudo generarse hace días y lo que
 * "tenías" puede haberse acabado.
 */
export function liveStatus(ingredient: RecipeIngredient, items: FridgeItem[]): IngredientStatus {
  if (ingredient.status !== "tengo") return ingredient.status;
  return items.some((i) => sameFood(i.name, ingredient.name)) ? "tengo" : "falta";
}

/** Cuentas de los últimos días: cuánto se ha aprovechado y cuánto se ha tirado */
export function wasteStats(log: LogEntry[], days = 30) {
  const desde = addDays(-days);
  const reciente = log.filter((e) => e.date >= desde);
  const cocinado = reciente.filter((e) => e.reason === "cocinado").length;
  const tirado = reciente.filter((e) => e.reason === "tirado").length;
  const total = cocinado + tirado;
  return { cocinado, tirado, total, porcentaje: total ? Math.round((cocinado / total) * 100) : null };
}

/** Busca una receta por id entre las últimas generadas y las guardadas */
export function findRecipe(state: Pick<FrigoState, "recipes" | "saved">, id: string): Recipe | undefined {
  return state.recipes.find((r) => r.id === id) ?? state.saved.find((r) => r.id === id);
}
