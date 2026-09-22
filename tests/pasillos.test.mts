import assert from "node:assert/strict";
import { test } from "node:test";
import { groupByAisle, guessAisle } from "../src/lib/aisles.ts";

test("cada alimento cae en su sección del súper", () => {
  assert.equal(guessAisle("tomates"), "Frutería y verdura");
  assert.equal(guessAisle("pechuga de pollo"), "Carnicería");
  assert.equal(guessAisle("salmón fresco"), "Pescadería");
  assert.equal(guessAisle("leche entera"), "Lácteos y huevos");
  assert.equal(guessAisle("pan de molde"), "Panadería");
  assert.equal(guessAisle("arroz"), "Despensa");
  assert.equal(guessAisle("cerveza"), "Bebidas");
  assert.equal(guessAisle("papel de cocina"), "Droguería");
});

test("no se cuela por parecidos: 'tomate' no es la sección del té", () => {
  assert.equal(guessAisle("tomate"), "Frutería y verdura");
  assert.equal(guessAisle("tomate frito"), "Despensa");
  assert.equal(guessAisle("té verde"), "Despensa");
  assert.equal(guessAisle("panceta"), "Carnicería", "panceta no es panadería");
  assert.equal(guessAisle("leche de avena"), "Lácteos y huevos");
});

test("en 'algo de algo' manda la primera palabra", () => {
  assert.equal(guessAisle("zumo de naranja"), "Bebidas");
  assert.equal(guessAisle("pan de molde"), "Panadería");
  assert.equal(guessAisle("papel de cocina"), "Droguería");
  assert.equal(guessAisle("pechuga de pollo"), "Carnicería");
  assert.equal(guessAisle("crema de calabaza"), "Frutería y verdura");
});

test("lo que no se reconoce va a Otros", () => {
  assert.equal(guessAisle("chuches de la fiesta"), "Otros");
  assert.equal(guessAisle(""), "Otros");
});

test("las secciones salen en el orden del súper y sin vacías", () => {
  const lista = ["cerveza", "tomate", "pollo", "leche", "algo raro"].map((name) => ({ name }));
  const grupos = groupByAisle(lista, (i) => i.name);

  assert.deepEqual(
    grupos.map(([aisle, items]) => [aisle, items.length]),
    [
      ["Frutería y verdura", 1],
      ["Carnicería", 1],
      ["Lácteos y huevos", 1],
      ["Bebidas", 1],
      ["Otros", 1],
    ],
  );
});
