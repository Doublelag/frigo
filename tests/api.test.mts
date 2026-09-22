import assert from "node:assert/strict";
import { test } from "node:test";
import { outputSchema } from "../src/lib/claude.ts";
import { rateLimit } from "../src/lib/rate-limit.ts";
import { DetectRequestSchema, DetectionSchema, RecipesRequestSchema, RecipesSchema } from "../src/lib/schemas.ts";
import { SPRITES } from "../src/lib/sprites.ts";

const foto = (data = "x".repeat(200)) => ({ media_type: "image/jpeg" as const, data });

const peticionRecetas = {
  today: "2026-09-22",
  inventory: [{ name: "huevos", quantity: "6", days_left: 3 }],
  prefs: {
    diet: "omnivora",
    allergies: [],
    dislikes: [],
    maxMinutes: 30,
    servings: 2,
    skill: "medio",
    pantry: ["sal"],
  },
  filters: { meal: "cena", maxMinutes: 30, servings: 2, note: "" },
};

/* ---------- Lo que acepta el servidor ---------- */

test("una petición de escaneo normal se acepta", () => {
  assert.ok(DetectRequestSchema.safeParse({ today: "2026-09-22", images: [foto()] }).success);
});

test("se rechazan fechas raras, formatos raros y más de 4 fotos", () => {
  assert.ok(!DetectRequestSchema.safeParse({ today: "22/09/2026", images: [foto()] }).success);
  assert.ok(!DetectRequestSchema.safeParse({ today: "2026-09-22", images: [] }).success);
  assert.ok(!DetectRequestSchema.safeParse({ today: "2026-09-22", images: Array(5).fill(foto()) }).success);
  assert.ok(
    !DetectRequestSchema.safeParse({
      today: "2026-09-22",
      images: [{ media_type: "image/gif", data: "x".repeat(200) }],
    }).success,
  );
});

test("una foto gigante se rechaza antes de llamar a Claude", () => {
  assert.ok(!DetectRequestSchema.safeParse({ today: "2026-09-22", images: [foto("x".repeat(7_000_001))] }).success);
});

test("la petición de recetas admite avoidTitles vacío por defecto", () => {
  const parsed = RecipesRequestSchema.safeParse(peticionRecetas);
  assert.ok(parsed.success);
  assert.deepEqual(parsed.data.avoidTitles, []);
});

test("se rechaza una nevera vacía o una dieta inventada", () => {
  assert.ok(!RecipesRequestSchema.safeParse({ ...peticionRecetas, inventory: [] }).success);
  assert.ok(
    !RecipesRequestSchema.safeParse({ ...peticionRecetas, prefs: { ...peticionRecetas.prefs, diet: "carnivora" } })
      .success,
  );
});

/* ---------- Lo que debe devolver Claude ---------- */

test("una respuesta de detección válida pasa la validación", () => {
  const ok = DetectionSchema.safeParse({
    items: [
      {
        name: "huevos",
        emoji: "🥚",
        category: "huevos",
        quantity: "6",
        days_left: null,
        expiry_source: "estimada",
        confidence: "alta",
      },
    ],
  });
  assert.ok(ok.success);
});

test("una categoría o dificultad fuera de la lista se detecta", () => {
  const item = {
    name: "leche",
    emoji: "🥛",
    category: "lácteos", // con tilde: no es una de las categorías
    quantity: "1",
    days_left: 3,
    expiry_source: "estimada",
    confidence: "alta",
  };
  assert.ok(!DetectionSchema.safeParse({ items: [item] }).success);
  assert.ok(!RecipesSchema.safeParse({ recipes: [{ difficulty: "regulera" }] }).success);
});

/* ---------- El esquema que se manda a la API ---------- */

test("el esquema conserva los enum (si se pierden, Claude puede inventarse valores)", () => {
  const schema = outputSchema(DetectionSchema) as {
    properties: { items: { items: { properties: Record<string, { enum?: string[] }> } } };
  };
  const categoria = schema.properties.items.items.properties.category;
  assert.deepEqual(categoria.enum?.slice(0, 3), ["fruta", "verdura", "carne"]);
});

test("el esquema no lleva $schema ni tipos en lista (la API solo admite anyOf)", () => {
  const schema = outputSchema(DetectionSchema);
  assert.equal(schema.$schema, undefined);

  const json = JSON.stringify(schema);
  assert.ok(!json.includes('"type":['), "no debe haber type como lista");
  assert.ok(json.includes('"anyOf"'), "los campos que admiten null usan anyOf");
});

/* ---------- Límite de uso ---------- */

test("el límite por IP corta al llegar al máximo y se reinicia al pasar la ventana", async () => {
  const key = `test-${Math.random()}`;
  assert.ok(rateLimit(key, 2, 50).ok);
  assert.ok(rateLimit(key, 2, 50).ok);

  const blocked = rateLimit(key, 2, 50);
  assert.equal(blocked.ok, false);

  await new Promise((r) => setTimeout(r, 60));
  assert.ok(rateLimit(key, 2, 50).ok, "pasada la ventana vuelve a dejar");
});

/* ---------- Dibujos ---------- */

test("los sprites son cuadrados de 16x16 y usan colores definidos", () => {
  for (const [name, sprite] of Object.entries(SPRITES)) {
    assert.equal(sprite.rows.length, 16, `${name}: debe tener 16 filas`);
    for (const [y, row] of sprite.rows.entries()) {
      assert.equal(row.length, 16, `${name}: la fila ${y} no mide 16`);
      for (const char of row) {
        assert.ok(char === "." || sprite.palette[char], `${name}: el color "${char}" no está en la paleta`);
      }
    }
  }
});
