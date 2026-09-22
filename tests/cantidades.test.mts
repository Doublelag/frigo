import assert from "node:assert/strict";
import { test } from "node:test";
import { scaleAmount } from "../src/lib/amounts.ts";

test("doblar raciones dobla las cantidades", () => {
  assert.equal(scaleAmount("2 filetes", 2), "4 filetes");
  assert.equal(scaleAmount("250 g", 2), "500 g");
  assert.equal(scaleAmount("1 cebolla", 3), "3 cebolla");
});

test("la mitad de raciones usa fracciones normales de cocina", () => {
  assert.equal(scaleAmount("1 cebolla", 0.5), "1/2 cebolla");
  assert.equal(scaleAmount("3 huevos", 0.5), "1 y 1/2 huevos");
  assert.equal(scaleAmount("1/2 pimiento", 0.5), "1/4 pimiento");
});

test("no toca lo que no son números", () => {
  assert.equal(scaleAmount("al gusto", 2), "al gusto");
  assert.equal(scaleAmount("un puñado", 3), "un puñado");
  assert.equal(scaleAmount("", 2), "");
});

test("con las mismas raciones no cambia nada", () => {
  assert.equal(scaleAmount("2 filetes", 1), "2 filetes");
});

test("las cantidades con coma también se escalan", () => {
  assert.equal(scaleAmount("0,5 l de leche", 2), "1 l de leche");
});
