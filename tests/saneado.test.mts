import assert from "node:assert/strict";
import { test } from "node:test";
import { sanear as sanearParaPruebas } from "../src/lib/gemini.ts";
import { DetectionSchema, RecipesSchema } from "../src/lib/schemas.ts";

/**
 * Los modelos pequeños contestan casi bien: lista pelada, tildes de más,
 * números como texto. Esto comprueba que la app lo endereza en vez de fallar.
 */

test("acepta la lista pelada, sin el objeto de alrededor", () => {
  const crudo = [
    {
      name: "leche entera",
      emoji: "🥛",
      category: "lacteos",
      quantity: "1 brik",
      days_left: 5,
      expiry_source: "estimada",
      confidence: "alta",
    },
  ];
  const parsed = DetectionSchema.safeParse(sanearParaPruebas(crudo, "items"));
  assert.ok(parsed.success);
  assert.equal(parsed.data.items[0].name, "leche entera");
});

test("corrige categorías con tilde y días escritos como texto", () => {
  const crudo = {
    items: [
      {
        name: "yogur",
        emoji: "🥣",
        category: "lácteos", // con tilde
        quantity: "6",
        days_left: "12", // texto
        expiry_source: "ETIQUETA", // mayúsculas
        confidence: "Alta",
      },
    ],
  };
  const parsed = DetectionSchema.safeParse(sanearParaPruebas(crudo, "items"));
  assert.ok(parsed.success);
  const item = parsed.data.items[0];
  assert.equal(item.category, "lacteos");
  assert.equal(item.days_left, 12);
  assert.equal(item.expiry_source, "etiqueta");
  assert.equal(item.confidence, "alta");
});

test("lo que no se entiende cae en valores seguros, no rompe", () => {
  const crudo = { items: [{ name: "algo raro", category: "inventada", days_left: "no lo sé" }] };
  const parsed = DetectionSchema.safeParse(sanearParaPruebas(crudo, "items"));
  assert.ok(parsed.success);
  const item = parsed.data.items[0];
  assert.equal(item.category, "otros");
  assert.equal(item.days_left, null, "si no hay fecha clara, sin fecha");
  assert.equal(item.confidence, "media");
  assert.ok(item.emoji.length > 0);
});

test("las recetas también se enderezan", () => {
  const crudo = {
    recipes: [
      {
        title: "Tortilla",
        description: "De patatas",
        minutes: "25",
        difficulty: "FACIL",
        servings: "2",
        ingredients: [{ name: "huevos", amount: "4", status: "Tengo" }],
        steps: ["Batir", "Cuajar"],
      },
    ],
  };
  const parsed = RecipesSchema.safeParse(sanearParaPruebas(crudo, "recipes"));
  assert.ok(parsed.success);
  const receta = parsed.data.recipes[0];
  assert.equal(receta.minutes, 25);
  assert.equal(receta.difficulty, "fácil");
  assert.equal(receta.ingredients[0].status, "tengo");
  assert.equal(receta.tip, "");
});

test("una respuesta vacía no revienta, devuelve lista vacía", () => {
  const parsed = DetectionSchema.safeParse(sanearParaPruebas({}, "items"));
  assert.ok(parsed.success);
  assert.deepEqual(parsed.data.items, []);
});
