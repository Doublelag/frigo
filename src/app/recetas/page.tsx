"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Minus, Plus, RefreshCw, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { PixelScreen } from "@/components/PixelArt";
import { RecipeCard } from "@/components/RecipeCard";
import { Chips, DemoBanner, OfflineNotice, PageHeader, useDemoMode } from "@/components/ui";
import { fetchRecipes } from "@/lib/api";
import { normalizeName, useFrigo } from "@/lib/store";
import type { MealType } from "@/lib/types";

const MEALS: { value: MealType; label: string }[] = [
  { value: "cualquiera", label: "Lo que sea" },
  { value: "desayuno", label: "Desayuno" },
  { value: "comida", label: "Comida" },
  { value: "cena", label: "Cena" },
  { value: "postre", label: "Postre" },
  { value: "picoteo", label: "Picoteo" },
];

const LOADING_STEPS = [
  "Mirando lo que tienes…",
  "Descartando lo que no encaja…",
  "Ajustando cantidades…",
  "Casi está…",
];

const TIMES = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 90, label: "Sin prisa" },
];

export default function RecipesPage() {
  return (
    <Suspense>
      <Recipes />
    </Suspense>
  );
}

function Recipes() {
  const router = useRouter();
  const params = useSearchParams();
  const items = useFrigo((s) => s.items);
  const prefs = useFrigo((s) => s.prefs);
  const filters = useFrigo((s) => s.filters);
  const setFilters = useFrigo((s) => s.setFilters);
  const adjustServings = useFrigo((s) => s.adjustServings);
  const recipes = useFrigo((s) => s.recipes);
  const setRecipes = useFrigo((s) => s.setRecipes);
  const saved = useFrigo((s) => s.saved);

  const [tab, setTab] = useState<"ideas" | "guardadas">("ideas");
  const [savedQuery, setSavedQuery] = useState("");

  // Busca por título y también por ingrediente ("¿qué hacía yo con puerro?")
  const savedFiltradas = useMemo(() => {
    const q = normalizeName(savedQuery);
    if (!q) return saved;
    return saved.filter(
      (r) =>
        normalizeName(r.title).includes(q) ||
        r.ingredients.some((i) => normalizeName(i.name).includes(q)) ||
        normalizeName(r.description).includes(q),
    );
  }, [saved, savedQuery]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const demoMode = useDemoMode();
  const [editingFilters, setEditingFilters] = useState(false);
  const [generated, setGenerated] = useState(false);
  const autoStarted = useRef(false);
  const showFilters = editingFilters || recipes.length === 0;

  const generate = useCallback(
    async (opts: { more?: boolean; note?: string } = {}) => {
      setStep(0);
      setLoading(true);
      setError(null);
      try {
        const res = await fetchRecipes({
          items,
          prefs,
          filters: opts.note !== undefined ? { ...filters, note: opts.note } : filters,
          avoidTitles: opts.more ? recipes.map((r) => r.title) : [],
        });
        setDemo(res.demo);
        setRecipes(res.recipes);
        setGenerated(true);
        setEditingFilters(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Algo ha ido mal. Prueba otra vez.");
      } finally {
        setLoading(false);
      }
    },
    [items, prefs, filters, recipes, setRecipes],
  );

  // Las recetas tardan bastante: se va contando por dónde va
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 6000);
    return () => clearInterval(t);
  }, [loading]);

  // Desde el aviso de "caduca pronto" de la nevera
  useEffect(() => {
    if (params.get("aprovechar") !== "1" || autoStarted.current || items.length === 0) return;
    autoStarted.current = true;
    router.replace("/recetas");
    generate({ note: "Quiero gastar primero lo que caduca antes" });
  }, [params, items.length, router, generate]);

  if (items.length === 0 && saved.length === 0) {
    return (
      <>
        <PageHeader title="Recetas" />
        <div className="card flex flex-col items-center px-6 py-10 text-center">
          <PixelScreen sprite="hat" className="mb-5" />
          <h2 className="font-display text-lg font-bold">Primero, ¿qué hay en la nevera?</h2>
          <p className="mt-2 max-w-xs text-muted">Las recetas salen de lo que tienes. Escanea la nevera y vuelve.</p>
          <Link href="/escanear" className="btn btn-primary mt-7 w-full">
            <Camera size={20} />
            Escanear mi nevera
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Recetas" subtitle={`Con los ${items.length} alimentos de tu nevera`} />

      {demoMode && <DemoBanner />}

      <OfflineNotice>Sin conexión no se pueden pedir recetas nuevas, pero las guardadas siguen aquí.</OfflineNotice>

      <div role="tablist" className="mb-5 grid grid-cols-2 rounded-full bg-surface-2 p-1">
        {(["ideas", "guardadas"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${
              tab === t ? "bg-surface text-ink shadow-card" : "text-muted"
            }`}
          >
            {t === "ideas" ? "Ideas" : `Guardadas${saved.length ? ` · ${saved.length}` : ""}`}
          </button>
        ))}
      </div>

      {tab === "guardadas" ? (
        saved.length === 0 ? (
          <p className="py-10 text-center text-muted">Guarda las recetas que te gusten y aparecerán aquí.</p>
        ) : (
          <div className="space-y-3">
            {saved.length > 4 && (
              <div className="relative mb-4">
                <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
                <input
                  className="input pl-11"
                  type="search"
                  placeholder="Buscar en tus recetas"
                  value={savedQuery}
                  onChange={(e) => setSavedQuery(e.target.value)}
                />
              </div>
            )}
            {savedFiltradas.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
            {savedFiltradas.length === 0 && (
              <p className="py-10 text-center text-muted">Ninguna receta guardada coincide con “{savedQuery}”.</p>
            )}
          </div>
        )
      ) : (
        <>
          {!showFilters && (
            <div className="card mb-5 flex items-center gap-3 py-2 pr-2 pl-4">
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="font-semibold">{MEALS.find((m) => m.value === filters.meal)?.label}</span>
                <span className="text-muted">
                  {" "}
                  · {TIMES.find((t) => t.value === filters.maxMinutes)?.label ?? `${filters.maxMinutes} min`} ·{" "}
                  {filters.servings} {filters.servings === 1 ? "ración" : "raciones"}
                  {filters.onlyHave && " · sin comprar nada"}
                  {filters.note && ` · ${filters.note}`}
                </span>
              </p>
              <button
                className="btn btn-soft h-9 min-h-0 shrink-0 px-4 text-sm"
                onClick={() => setEditingFilters(true)}
              >
                <SlidersHorizontal size={15} />
                Cambiar
              </button>
            </div>
          )}

          {showFilters && (
            <section className="card mb-5 space-y-4 p-4" aria-label="Qué te apetece">
              <div>
                <p className="label">¿Para cuándo?</p>
                <Chips label="Momento" options={MEALS} value={filters.meal} onChange={(meal) => setFilters({ meal })} />
              </div>
              <div>
                <p className="label">Tiempo</p>
                <Chips
                  label="Tiempo máximo"
                  options={TIMES}
                  value={filters.maxMinutes}
                  onChange={(maxMinutes) => setFilters({ maxMinutes })}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="label mb-0">Raciones</p>
                <div className="flex items-center gap-3">
                  <button
                    className="icon-btn border border-line"
                    aria-label="Menos raciones"
                    disabled={filters.servings <= 1}
                    onClick={() => adjustServings(-1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-6 text-center font-semibold tabular-nums">{filters.servings}</span>
                  <button
                    className="icon-btn border border-line"
                    aria-label="Más raciones"
                    disabled={filters.servings >= 12}
                    onClick={() => adjustServings(1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="chip w-full justify-between px-4"
                aria-pressed={filters.onlyHave}
                onClick={() => setFilters({ onlyHave: !filters.onlyHave })}
              >
                Sin comprar nada
                <span
                  aria-hidden
                  className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                    filters.onlyHave ? "bg-brand" : "bg-line"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-surface transition-transform ${filters.onlyHave ? "translate-x-4" : ""}`}
                  />
                </span>
              </button>
              <input
                className="input"
                value={filters.note}
                onChange={(e) => setFilters({ note: e.target.value })}
                placeholder="Algo más… (ligero, para táper, sin horno…)"
                maxLength={200}
              />
              <button
                className="btn btn-primary w-full"
                disabled={loading || items.length === 0}
                onClick={() => generate()}
              >
                <Sparkles size={18} />
                {loading ? LOADING_STEPS[step] : recipes.length ? "Nuevas ideas" : "Proponer recetas"}
              </button>
            </section>
          )}

          {demo && <DemoBanner />}

          {error && (
            <p role="alert" className="mb-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card flex gap-4 p-4">
                  <div className="skeleton h-16 w-16 shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recipes.length === 0 && generated ? (
            <div className="card p-6 text-center">
              <p className="font-semibold">No ha salido nada que encaje</p>
              <p className="mt-1 text-sm text-muted">
                {filters.onlyHave
                  ? "Prueba a quitar “sin comprar nada” o a darle más tiempo."
                  : "Prueba con otro momento del día, más tiempo o añade algo más a la nevera."}
              </p>
            </div>
          ) : (
            recipes.length > 0 && (
              <div className="space-y-3">
                {recipes.map((r) => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
                <button className="btn btn-ghost w-full" onClick={() => generate({ more: true })}>
                  <RefreshCw size={16} />
                  Otras distintas
                </button>
              </div>
            )
          )}
        </>
      )}
    </>
  );
}
