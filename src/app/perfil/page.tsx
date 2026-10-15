"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { BackupError, downloadBackup, restoreBackup } from "@/lib/backup";
import { APP_NAME } from "@/lib/brand";
import { useInstall, useIsInstalled, useIsIOS } from "@/lib/install";
import type { Theme } from "@/lib/theme";
import { Chips, PageHeader, Sheet, TagInput } from "@/components/ui";
import { DEFAULT_PREFS, useFrigo, wasteStats } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Diet, Skill } from "@/lib/types";

// Los 14 alérgenos de declaración obligatoria en la UE, en lenguaje de calle
const ALLERGENS = [
  "gluten",
  "lactosa",
  "huevo",
  "frutos secos",
  "cacahuete",
  "marisco",
  "pescado",
  "soja",
  "sésamo",
  "mostaza",
  "apio",
  "sulfitos",
  "altramuces",
  "moluscos",
];

const DIETS: { value: Diet; label: string }[] = [
  { value: "omnivora", label: "Como de todo" },
  { value: "vegetariana", label: "Vegetariana" },
  { value: "vegana", label: "Vegana" },
  { value: "pescetariana", label: "Pescetariana" },
];

const SKILLS: { value: Skill; label: string }[] = [
  { value: "basico", label: "Lo justo" },
  { value: "medio", label: "Me apaño" },
  { value: "avanzado", label: "Me encanta cocinar" },
];

const TIMES = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 90, label: "Sin prisa" },
];

export default function ProfilePage() {
  const prefs = useFrigo((s) => s.prefs);
  const setPrefs = useFrigo((s) => s.setPrefs);
  const theme = useFrigo((s) => s.theme);
  const setTheme = useFrigo((s) => s.setTheme);
  const setFilters = useFrigo((s) => s.setFilters);
  const resetStore = useFrigo((s) => s.resetAll);
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);

  const resetAll = () => {
    resetStore();
    toast("Datos borrados");
    router.push("/");
  };

  return (
    <>
      <PageHeader title="Perfil" subtitle="Todas las recetas respetan lo que pongas aquí." />

      <div className="space-y-4">
        <Block title="Aspecto">
          <Chips
            label="Tema"
            options={[
              { value: "oscuro" as Theme, label: "🌙 Oscuro" },
              { value: "claro" as Theme, label: "☀️ Claro" },
              { value: "sistema" as Theme, label: "Automático" },
            ]}
            value={theme}
            onChange={setTheme}
          />
        </Block>

        <Block title="Dieta">
          <Chips label="Dieta" options={DIETS} value={prefs.diet} onChange={(diet) => setPrefs({ diet })} />
        </Block>

        <Block title="Alergias e intolerancias" hint="Nunca aparecerán en una receta.">
          <TagInput
            values={prefs.allergies}
            onChange={(allergies) => setPrefs({ allergies })}
            placeholder="Otra alergia…"
            suggestions={ALLERGENS}
          />
        </Block>

        <Block title="No me gusta">
          <TagInput
            values={prefs.dislikes}
            onChange={(dislikes) => setPrefs({ dislikes })}
            placeholder="p. ej. cilantro, berenjena…"
          />
        </Block>

        <Block title="Siempre tengo en la despensa" hint="Se dan por hechos y no cuentan como “falta”.">
          <TagInput
            values={prefs.pantry}
            onChange={(pantry) => setPrefs({ pantry })}
            placeholder="p. ej. arroz, pasta, pimentón…"
            suggestions={[
              "arroz",
              "pasta",
              "pimentón",
              "comino",
              "orégano",
              "caldo",
              "tomate triturado",
              "legumbres de bote",
            ]}
          />
        </Block>

        <Block title="En la cocina">
          <Chips label="Nivel" options={SKILLS} value={prefs.skill} onChange={(skill) => setPrefs({ skill })} />
        </Block>

        <Block title="Tiempo normal para cocinar">
          <Chips
            label="Tiempo"
            options={TIMES}
            value={prefs.maxMinutes}
            onChange={(maxMinutes) => {
              setPrefs({ maxMinutes });
              setFilters({ maxMinutes });
            }}
          />
        </Block>

        <Block title="Normalmente cocino para">
          <Chips
            label="Raciones"
            options={[1, 2, 3, 4, 6].map((n) => ({ value: n, label: n === 1 ? "1 persona" : `${n}` }))}
            value={prefs.servings}
            onChange={(servings) => {
              setPrefs({ servings });
              setFilters({ servings });
            }}
          />
        </Block>

        <StatsBlock />

        <BackupBlock />

        <InstallBlock />

        <div className="flex flex-col gap-2 pt-4">
          <button
            className="btn btn-ghost"
            onClick={() => {
              setPrefs(DEFAULT_PREFS);
              toast("Preferencias restablecidas");
            }}
          >
            Restablecer preferencias
          </button>
          <button className="btn text-danger" onClick={() => setConfirmReset(true)}>
            Borrar todos mis datos
          </button>
        </div>

        <p className="pt-2 text-center text-xs text-muted">
          Tus datos se guardan solo en este dispositivo ·{" "}
          <Link href="/legal" className="font-semibold underline">
            Privacidad
          </Link>
        </p>
      </div>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="¿Borrar todo?">
        <p className="mb-5 text-muted">
          Se borran la nevera, la lista de la compra, las recetas guardadas y tus preferencias de este dispositivo. No
          se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={() => setConfirmReset(false)}>
            Cancelar
          </button>
          <button className="btn btn-danger flex-1" onClick={resetAll}>
            Borrar todo
          </button>
        </div>
      </Sheet>
    </>
  );
}

/** Copia de seguridad en un archivo: sin cuentas, es la forma de cambiar de móvil */
function BackupBlock() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const importar = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const total = await restoreBackup(file);
      toast(`Copia restaurada: ${total} ${total === 1 ? "alimento" : "alimentos"}`);
    } catch (e) {
      setError(e instanceof BackupError ? e.message : "No se ha podido leer la copia.");
    }
  };

  return (
    <Block title="Copia de seguridad" hint="Tus datos están solo en este móvil. Guarda una copia por si acaso.">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          importar(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1" onClick={downloadBackup}>
          <Download size={17} />
          Exportar
        </button>
        <button className="btn btn-ghost flex-1" onClick={() => fileRef.current?.click()}>
          <Upload size={17} />
          Importar
        </button>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
    </Block>
  );
}

/** Cuánto acaba en la mesa y cuánto en la basura, del último mes */
function StatsBlock() {
  const log = useFrigo((s) => s.log);
  const stats = wasteStats(log);

  return (
    <Block title="Lo que aprovechas" hint="Últimos 30 días, según lo que marcas en la nevera.">
      {stats.total === 0 ? (
        <p className="text-sm text-muted">
          Cuando gastes o tires algo, márcalo al abrirlo en la nevera y aquí verás cuánto aprovechas.
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <span className="font-display text-3xl font-bold text-brand">{stats.porcentaje}%</span>
          <span className="text-sm">
            <span className="block">
              <strong>{stats.cocinado}</strong> {stats.cocinado === 1 ? "aprovechado" : "aprovechados"}
            </span>
            <span className="block text-muted">
              {stats.tirado} {stats.tirado === 1 ? "a la basura" : "a la basura"}
            </span>
          </span>
        </div>
      )}
    </Block>
  );
}

/** Instalar en la pantalla de inicio: Android/escritorio con un botón, iPhone a mano */
function InstallBlock() {
  const prompt = useInstall((s) => s.prompt);
  const setPrompt = useInstall((s) => s.setPrompt);
  const installed = useIsInstalled();
  const ios = useIsIOS();

  if (installed) return null;
  if (!prompt && !ios) return null;

  return (
    <Block title={`Tener ${APP_NAME} a mano`}>
      {prompt ? (
        <button
          className="btn btn-primary w-full"
          onClick={async () => {
            await prompt.prompt();
            const { outcome } = await prompt.userChoice;
            setPrompt(null);
            if (outcome === "accepted") toast("¡Instalada! Búscala entre tus apps");
          }}
        >
          <Download size={18} />
          Instalar en el móvil
        </button>
      ) : (
        <p className="text-sm text-muted">
          En iPhone: toca <strong>Compartir</strong> en la barra del navegador y luego{" "}
          <strong>Añadir a pantalla de inicio</strong>.
        </p>
      )}
    </Block>
  );
}

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
