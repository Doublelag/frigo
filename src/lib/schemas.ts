import { z } from "zod";
import { CATEGORIES } from "./types";

/* ---------- Lo que Claude tiene que devolver ---------- */

export const DetectionSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Nombre genérico en español de España, en minúscula"),
      emoji: z.string().describe("Un solo emoji"),
      category: z.enum(CATEGORIES),
      quantity: z.string(),
      days_left: z.number().nullable().describe("Días hasta caducar contando desde hoy; null si no aplica"),
      expiry_source: z.enum(["etiqueta", "estimada"]),
      confidence: z.enum(["alta", "media", "baja"]),
    }),
  ),
});

export const RecipesSchema = z.object({
  recipes: z.array(
    z.object({
      title: z.string(),
      emoji: z.string().describe("Un solo emoji que represente el plato"),
      description: z.string(),
      minutes: z.number().describe("Tiempo total en minutos"),
      difficulty: z.enum(["fácil", "media", "difícil"]),
      servings: z.number(),
      uses_expiring: z.array(z.string()),
      ingredients: z.array(
        z.object({
          name: z.string(),
          amount: z.string(),
          status: z.enum(["tengo", "despensa", "falta"]),
        }),
      ),
      steps: z.array(z.string()),
      tip: z.string(),
    }),
  ),
});

/* ---------- Lo que aceptan nuestras rutas /api ---------- */

// ~5 MB por imagen en base64 (las fotos llegan ya reducidas desde el móvil)
const MAX_IMAGE_B64 = 7_000_000;

// La fecha la pone el móvil: el servidor puede estar en otra zona horaria
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const DetectRequestSchema = z.object({
  today: isoDate,
  /** Qué se ha fotografiado: la nevera/despensa o un ticket del súper */
  source: z.enum(["nevera", "ticket"]).default("nevera"),
  images: z
    .array(
      z.object({
        media_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
        data: z.string().min(100).max(MAX_IMAGE_B64),
      }),
    )
    .min(1)
    .max(4),
});

const short = (max: number) => z.string().trim().max(max);

export const RecipesRequestSchema = z.object({
  today: isoDate,
  inventory: z
    .array(
      z.object({
        name: short(80),
        quantity: short(60),
        days_left: z.number().int().min(-365).max(3650).nullable(),
      }),
    )
    .min(1)
    .max(150),
  prefs: z.object({
    diet: z.enum(["omnivora", "vegetariana", "vegana", "pescetariana"]),
    allergies: z.array(short(40)).max(30),
    dislikes: z.array(short(40)).max(40),
    maxMinutes: z.number().int().min(5).max(600),
    servings: z.number().int().min(1).max(20),
    skill: z.enum(["basico", "medio", "avanzado"]),
    pantry: z.array(short(40)).max(60),
  }),
  filters: z.object({
    meal: z.enum(["cualquiera", "desayuno", "comida", "cena", "postre", "picoteo"]),
    maxMinutes: z.number().int().min(5).max(600),
    servings: z.number().int().min(1).max(20),
    onlyHave: z.boolean().default(false),
    note: short(200),
  }),
  avoidTitles: z.array(short(120)).max(20).default([]),
});

export type DetectRequest = z.infer<typeof DetectRequestSchema>;
export type RecipesRequest = z.infer<typeof RecipesRequestSchema>;
