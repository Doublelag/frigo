"use client";

import { z } from "zod";
import { CATEGORIES } from "./types";
import { DEFAULT_FILTERS, DEFAULT_PREFS, useFrigo } from "./store";
import { todayISO } from "./dates";
import { APP_NAME } from "./brand";

/**
 * Copia de seguridad en un archivo. Mientras no haya cuentas, es la forma de
 * no perder la nevera al cambiar de móvil o de navegador.
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  category: z.enum(CATEGORIES),
  quantity: z.string(),
  expiresAt: isoDate.nullable(),
  addedAt: z.string(),
});

const RecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  emoji: z.string(),
  description: z.string(),
  minutes: z.number(),
  difficulty: z.enum(["fácil", "media", "difícil"]),
  servings: z.number(),
  uses_expiring: z.array(z.string()),
  ingredients: z.array(
    z.object({ name: z.string(), amount: z.string(), status: z.enum(["tengo", "despensa", "falta"]) }),
  ),
  steps: z.array(z.string()),
  tip: z.string(),
  createdAt: z.string(),
});

export const BackupSchema = z.object({
  // "frigo" era el nombre anterior: las copias viejas se siguen admitiendo
  app: z.enum(["salvacenas", "frigo"]),
  version: z.number(),
  exportedAt: z.string(),
  data: z.object({
    items: z.array(ItemSchema),
    shopping: z.array(z.object({ id: z.string(), name: z.string(), note: z.string(), checked: z.boolean() })),
    saved: z.array(RecipeSchema),
    prefs: z.object({
      diet: z.enum(["omnivora", "vegetariana", "vegana", "pescetariana"]),
      allergies: z.array(z.string()),
      dislikes: z.array(z.string()),
      maxMinutes: z.number(),
      servings: z.number(),
      skill: z.enum(["basico", "medio", "avanzado"]),
      pantry: z.array(z.string()),
    }),
    log: z.array(z.object({ date: z.string(), name: z.string(), reason: z.enum(["cocinado", "tirado", "quitado"]) })),
  }),
});

export type Backup = z.infer<typeof BackupSchema>;

export function buildBackup(): Backup {
  const { items, shopping, saved, prefs, log } = useFrigo.getState();
  return {
    app: "salvacenas",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { items, shopping, saved, prefs, log },
  };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${APP_NAME.toLowerCase()}-${todayISO()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export class BackupError extends Error {}

/** Sustituye los datos actuales por los del archivo */
export async function restoreBackup(file: File): Promise<number> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new BackupError(`Ese archivo no es una copia de ${APP_NAME}.`);
  }

  const backup = BackupSchema.safeParse(parsed);
  if (!backup.success) throw new BackupError("La copia está incompleta o es de otra versión.");

  const { items, shopping, saved, prefs, log } = backup.data.data;
  useFrigo.setState({
    items,
    shopping,
    saved,
    log,
    prefs: { ...DEFAULT_PREFS, ...prefs },
    filters: { ...DEFAULT_FILTERS, servings: prefs.servings, maxMinutes: prefs.maxMinutes },
    recipes: [],
    onboarded: true,
  });
  return items.length;
}
