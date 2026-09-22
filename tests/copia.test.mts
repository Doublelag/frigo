import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { BackupError, BackupSchema, buildBackup, restoreBackup } from "../src/lib/backup.ts";
import { DEFAULT_PREFS, useFrigo } from "../src/lib/store.ts";
import type { DetectedItem } from "../src/lib/types.ts";

const detected: DetectedItem = {
  name: "huevos",
  emoji: "🥚",
  category: "huevos",
  quantity: "6",
  days_left: 10,
  expiry_source: "estimada",
  confidence: "alta",
};

const archivo = (contenido: unknown) =>
  new File([typeof contenido === "string" ? contenido : JSON.stringify(contenido)], "copia.json", {
    type: "application/json",
  });

beforeEach(() => {
  useFrigo.setState({ items: [], shopping: [], recipes: [], saved: [], log: [], prefs: DEFAULT_PREFS });
});

test("exportar e importar devuelve la nevera tal cual estaba", async () => {
  useFrigo.getState().addDetected([detected]);
  useFrigo.getState().addShopping([{ name: "cebolla" }]);
  useFrigo.getState().setPrefs({ allergies: ["gluten"], diet: "vegetariana" });

  const copia = buildBackup();
  assert.ok(BackupSchema.safeParse(copia).success);

  // Se borra todo y se restaura desde el archivo
  useFrigo.getState().resetAll();
  assert.equal(useFrigo.getState().items.length, 0);

  const total = await restoreBackup(archivo(copia));
  assert.equal(total, 1);

  const state = useFrigo.getState();
  assert.equal(state.items[0].name, "huevos");
  assert.equal(state.shopping[0].name, "cebolla");
  assert.deepEqual(state.prefs.allergies, ["gluten"]);
  assert.equal(state.prefs.diet, "vegetariana");
});

test("un archivo que no es una copia de Frigo se rechaza sin romper nada", async () => {
  useFrigo.getState().addDetected([detected]);

  await assert.rejects(() => restoreBackup(archivo("esto no es json")), BackupError);
  await assert.rejects(() => restoreBackup(archivo({ app: "otra-cosa" })), BackupError);
  await assert.rejects(
    () => restoreBackup(archivo({ app: "frigo", version: 1, exportedAt: "hoy", data: { items: "mal" } })),
    BackupError,
  );

  assert.equal(useFrigo.getState().items.length, 1, "la nevera sigue intacta");
});
