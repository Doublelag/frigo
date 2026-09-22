import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { addDays } from "../src/lib/dates.ts";
import {
  DEFAULT_PREFS,
  foodKey,
  liveStatus,
  mergePersisted,
  sameFood,
  useFrigo,
  wasteStats,
} from "../src/lib/store.ts";
import type { DetectedItem, FridgeItem, Recipe } from "../src/lib/types.ts";

const detected = (over: Partial<DetectedItem> = {}): DetectedItem => ({
  name: "huevos",
  emoji: "🥚",
  category: "huevos",
  quantity: "6",
  days_left: 10,
  expiry_source: "estimada",
  confidence: "alta",
  ...over,
});

const vacia = () =>
  useFrigo.setState({
    items: [],
    shopping: [],
    recipes: [],
    saved: [],
    prefs: DEFAULT_PREFS,
    onboarded: false,
    log: [],
  });

beforeEach(vacia);

test("foodKey iguala plurales, tildes y artículos", () => {
  assert.equal(foodKey("Huevos"), foodKey("huevo"));
  assert.equal(foodKey("Tomates"), foodKey("tomate"));
  assert.equal(foodKey("plátanos"), foodKey("platano"));
  assert.equal(foodKey("los pimientos"), foodKey("pimiento"));
  assert.notEqual(foodKey("pollo"), foodKey("pavo"));
});

test("sameFood reconoce el ingrediente dentro del nombre largo", () => {
  assert.ok(sameFood("pollo", "pechuga de pollo"));
  assert.ok(sameFood("yogur natural", "yogures naturales"));
  assert.ok(!sameFood("leche", "lechuga"));
  assert.ok(!sameFood("", "leche"));
});

test("lo escaneado entra en la nevera con su fecha de caducidad", () => {
  useFrigo.getState().addDetected([detected({ days_left: 3 })]);
  const [item] = useFrigo.getState().items;
  assert.equal(item.name, "huevos");
  assert.equal(item.expiresAt, addDays(3));
});

test("escanear dos veces lo mismo actualiza, no duplica", () => {
  useFrigo.getState().addDetected([detected({ quantity: "6", days_left: 10 })]);
  useFrigo.getState().addDetected([detected({ name: "huevo", quantity: "2", days_left: 4 })]);

  const { items } = useFrigo.getState();
  assert.equal(items.length, 1, "huevo y huevos son lo mismo");
  assert.equal(items[0].quantity, "2");
  assert.equal(items[0].expiresAt, addDays(4));
});

test("sin fecha de caducidad se guarda como null", () => {
  useFrigo.getState().addDetected([detected({ days_left: null })]);
  assert.equal(useFrigo.getState().items[0].expiresAt, null);
});

test("añadir a mano algo que ya está no lo duplica", () => {
  const manual = { name: "leche", emoji: "🥛", category: "lacteos" as const, quantity: "1", expiresAt: null };
  useFrigo.getState().upsertItem(manual);
  useFrigo.getState().upsertItem({ ...manual, name: "leches", quantity: "2" });

  const { items } = useFrigo.getState();
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, "2");
});

test("editar por id cambia solo ese alimento", () => {
  useFrigo.getState().upsertItem({ name: "leche", emoji: "🥛", category: "lacteos", quantity: "1", expiresAt: null });
  const item = useFrigo.getState().items[0];
  useFrigo.getState().upsertItem({ ...item, quantity: "medio brik" });

  assert.equal(useFrigo.getState().items.length, 1);
  assert.equal(useFrigo.getState().items[0].quantity, "medio brik");
  assert.equal(useFrigo.getState().items[0].id, item.id);
});

test("la lista de la compra no repite lo que ya está pendiente", () => {
  const añadidas = useFrigo.getState().addShopping([{ name: "cebolla" }, { name: "Cebollas" }, { name: "  " }]);
  assert.equal(añadidas, 1);
  assert.equal(useFrigo.getState().shopping.length, 1);

  const repetida = useFrigo.getState().addShopping([{ name: "cebolla", note: "para la tortilla" }]);
  assert.equal(repetida, 0);
});

test("lo ya comprado no bloquea volver a añadirlo a la lista", () => {
  useFrigo.getState().addShopping([{ name: "cebolla" }]);
  useFrigo.getState().toggleShopping(useFrigo.getState().shopping[0].id);

  assert.equal(useFrigo.getState().addShopping([{ name: "cebolla" }]), 1);
});

test("guardar y quitar de guardadas la misma receta", () => {
  const receta = { id: "r1", title: "Tortilla" } as Recipe;
  useFrigo.getState().toggleSaved(receta);
  assert.equal(useFrigo.getState().saved.length, 1);
  useFrigo.getState().toggleSaved(receta);
  assert.equal(useFrigo.getState().saved.length, 0);
});

test("un ingrediente que ya no está en la nevera pasa a 'falta'", () => {
  const items: FridgeItem[] = [
    { id: "1", name: "huevos", emoji: "🥚", category: "huevos", quantity: "6", expiresAt: null, addedAt: "2026-09-22" },
  ];
  assert.equal(liveStatus({ name: "huevo", amount: "4", status: "tengo" }, items), "tengo");
  assert.equal(liveStatus({ name: "calabacín", amount: "1", status: "tengo" }, items), "falta");
  assert.equal(liveStatus({ name: "sal", amount: "una pizca", status: "despensa" }, items), "despensa");
});

test("quitar un alimento se puede deshacer y no deja rastro en el historial", () => {
  useFrigo.getState().addDetected([detected()]);
  const item = useFrigo.getState().items[0];

  const removed = useFrigo.getState().removeItems([item.id], "tirado");
  assert.equal(useFrigo.getState().items.length, 0);
  assert.equal(useFrigo.getState().log.length, 1);

  useFrigo.getState().restoreItems(removed);
  assert.equal(useFrigo.getState().items.length, 1);
  assert.equal(useFrigo.getState().items[0].id, item.id);
  assert.equal(useFrigo.getState().log.length, 0, "deshacer también borra la anotación");
});

test("las estadísticas cuentan lo aprovechado frente a lo tirado", () => {
  useFrigo.setState({
    log: [
      { date: addDays(-1), name: "pollo", reason: "cocinado" },
      { date: addDays(-2), name: "huevos", reason: "cocinado" },
      { date: addDays(-3), name: "yogur", reason: "cocinado" },
      { date: addDays(-4), name: "lechuga", reason: "tirado" },
      { date: addDays(-2), name: "pan", reason: "quitado" },
      { date: addDays(-90), name: "leche", reason: "tirado" },
    ],
  });

  const stats = wasteStats(useFrigo.getState().log);
  assert.equal(stats.cocinado, 3);
  assert.equal(stats.tirado, 1, "lo de hace 90 días queda fuera del mes");
  assert.equal(stats.porcentaje, 75);
  assert.equal(wasteStats([]).porcentaje, null);
});

test("subir raciones varias veces seguidas no pierde pulsaciones", () => {
  const inicial = useFrigo.getState().filters.servings;
  useFrigo.getState().adjustServings(1);
  useFrigo.getState().adjustServings(1);
  useFrigo.getState().adjustServings(1);
  assert.equal(useFrigo.getState().filters.servings, inicial + 3);

  for (let i = 0; i < 20; i++) useFrigo.getState().adjustServings(-1);
  assert.equal(useFrigo.getState().filters.servings, 1, "no baja de 1");

  for (let i = 0; i < 20; i++) useFrigo.getState().adjustServings(1);
  assert.equal(useFrigo.getState().filters.servings, 12, "no sube de 12");
});

test("al actualizar la app, los datos viejos conservan los ajustes nuevos", () => {
  // Así se guardó en una versión anterior: sin tema, sin historial y sin
  // algunos ajustes que hoy existen
  const viejo = {
    items: [],
    shopping: [],
    prefs: { diet: "vegana", allergies: ["soja"] },
    filters: { meal: "cena" },
  };

  const merged = mergePersisted(viejo, useFrigo.getState());
  assert.equal(merged.prefs.diet, "vegana", "se respeta lo que el usuario eligió");
  assert.deepEqual(merged.prefs.pantry, DEFAULT_PREFS.pantry, "y se rellena lo que falta");
  assert.equal(merged.filters.onlyHave, false);
  assert.equal(merged.theme, "oscuro");
  assert.deepEqual(merged.log, []);
});

test("borrar todos los datos deja la app como recién instalada", () => {
  useFrigo.getState().addDetected([detected()]);
  useFrigo.getState().addShopping([{ name: "pan" }]);
  useFrigo.getState().finishOnboarding();

  useFrigo.getState().resetAll();

  const state = useFrigo.getState();
  assert.deepEqual(state.items, []);
  assert.deepEqual(state.shopping, []);
  assert.deepEqual(state.saved, []);
  assert.equal(state.onboarded, false);
  assert.deepEqual(state.prefs, DEFAULT_PREFS);
});
