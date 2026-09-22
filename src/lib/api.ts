"use client";

import { daysLeft, todayISO } from "./dates";
import type { PreparedImage } from "./image";
import type { DetectedItem, FridgeItem, Preferences, Recipe, RecipeFilters } from "./types";
import { uid } from "./store";

/** Llamadas del móvil a nuestras rutas /api */

async function post<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Sin conexión. Revisa internet y prueba otra vez.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Algo ha ido mal. Prueba otra vez.");
  return data as T;
}

export async function detectFoods(images: PreparedImage[], source: "nevera" | "ticket" = "nevera") {
  return post<{ items: DetectedItem[]; demo: boolean }>("/api/detect", {
    today: todayISO(),
    source,
    images: images.map(({ media_type, data }) => ({ media_type, data })),
  });
}

export async function fetchRecipes(input: {
  items: FridgeItem[];
  prefs: Preferences;
  filters: RecipeFilters;
  avoidTitles?: string[];
}): Promise<{ recipes: Recipe[]; demo: boolean }> {
  const data = await post<{ recipes: Omit<Recipe, "id" | "createdAt">[]; demo: boolean }>("/api/recipes", {
    today: todayISO(),
    inventory: input.items.map((i) => ({ name: i.name, quantity: i.quantity, days_left: daysLeft(i.expiresAt) })),
    prefs: input.prefs,
    filters: input.filters,
    avoidTitles: input.avoidTitles ?? [],
  });
  const createdAt = new Date().toISOString();
  return { demo: data.demo, recipes: data.recipes.map((r) => ({ ...r, id: uid(), createdAt })) };
}
