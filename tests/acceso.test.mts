import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { accessRequired, accessToken, hasAccess, isValidCode } from "../src/lib/access.ts";

const original = process.env.FRIGO_BETA_CODE;
afterEach(() => {
  if (original === undefined) delete process.env.FRIGO_BETA_CODE;
  else process.env.FRIGO_BETA_CODE = original;
});

test("sin código configurado la app queda abierta", () => {
  delete process.env.FRIGO_BETA_CODE;
  assert.equal(accessRequired(), false);
  process.env.FRIGO_BETA_CODE = "   ";
  assert.equal(accessRequired(), false);
});

test("el código se acepta sin importar mayúsculas ni espacios", () => {
  process.env.FRIGO_BETA_CODE = "Tortilla2026";
  assert.equal(accessRequired(), true);
  assert.ok(isValidCode("tortilla2026"));
  assert.ok(isValidCode("  TORTILLA2026 "));
  assert.equal(isValidCode("paella"), false);
  assert.equal(isValidCode(""), false);
});

test("la cookie guarda el hash, nunca el código en claro", () => {
  process.env.FRIGO_BETA_CODE = "Tortilla2026";
  const token = accessToken();
  assert.ok(!token.toLowerCase().includes("tortilla"));
  assert.ok(hasAccess(token));
  assert.equal(hasAccess(undefined), false);
  assert.equal(hasAccess("tortilla2026"), false);
});
