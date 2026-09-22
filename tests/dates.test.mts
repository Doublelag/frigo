import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, daysLeft, expiryLabel, toISODate, todayISO, urgency } from "../src/lib/dates.ts";

test("addDays y daysLeft son coherentes entre sí", () => {
  for (const days of [0, 1, 3, 30, 365]) {
    assert.equal(daysLeft(addDays(days)), days);
  }
});

test("daysLeft cuenta días naturales, no horas", () => {
  const enUnRato = new Date();
  enUnRato.setHours(23, 59, 0, 0);
  assert.equal(daysLeft(toISODate(enUnRato)), 0, "esta noche sigue siendo hoy");
  assert.equal(daysLeft(null), null);
});

test("lo caducado da días negativos", () => {
  assert.equal(daysLeft(addDays(-2)), -2);
});

test("urgency agrupa como espera la pantalla de la nevera", () => {
  assert.equal(urgency(null), "sin-fecha");
  assert.equal(urgency(-1), "caducado");
  assert.equal(urgency(0), "urgente");
  assert.equal(urgency(2), "urgente");
  assert.equal(urgency(3), "pronto");
  assert.equal(urgency(5), "pronto");
  assert.equal(urgency(6), "ok");
});

test("los textos de caducidad están en castellano y sin números raros", () => {
  assert.equal(expiryLabel(null), "Sin fecha");
  assert.equal(expiryLabel(0), "Caduca hoy");
  assert.equal(expiryLabel(1), "Caduca mañana");
  assert.equal(expiryLabel(-1), "Caducó ayer");
  assert.equal(expiryLabel(-3), "Caducó hace 3 días");
  assert.equal(expiryLabel(4), "4 días");
  assert.equal(expiryLabel(45), "+1 mes");
  assert.equal(expiryLabel(120), "+4 meses");
});

test("todayISO tiene formato yyyy-mm-dd", () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});
