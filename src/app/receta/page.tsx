"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCheck,
  ChefHat,
  Clock,
  Lightbulb,
  Share2,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { CookingMode } from "@/components/CookingMode";
import { EmojiTile, Sheet } from "@/components/ui";
import { scaleAmount } from "@/lib/amounts";
import { findRecipe, foodKey, liveStatus, normalizeName, sameFood, useFrigo } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { FridgeItem, IngredientStatus } from "@/lib/types";

const STATUS_STYLE: Record<IngredientStatus, { label: string; cls: string }> = {
  tengo: { label: "tienes", cls: "bg-ok-soft text-ok" },
  despensa: { label: "despensa", cls: "bg-surface-2 text-muted" },
  falta: { label: "falta", cls: "bg-danger-soft text-danger" },
};

/**
 * La receta va en la query (/receta?id=…) y no en la ruta a propósito: así el
 * service worker puede servir la misma página guardada para cualquier receta
 * cuando no hay conexión.
 */
export default function RecipePageWrapper() {
  return (
    <Suspense>
      <RecipePage />
    </Suspense>
  );
}

function RecipePage() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const recipe = useFrigo((s) => findRecipe(s, id));
  const isSaved = useFrigo((s) => s.saved.some((r) => r.id === id));
  const toggleSaved = useFrigo((s) => s.toggleSaved);
  const addShopping = useFrigo((s) => s.addShopping);
  const items = useFrigo((s) => s.items);
  const removeItems = useFrigo((s) => s.removeItems);
  const restoreItems = useFrigo((s) => s.restoreItems);

  const [done, setDone] = useState<Set<number>>(new Set());
  const [cooking, setCooking] = useState(false);
  const [cookingMode, setCookingMode] = useState(false);
  const [used, setUsed] = useState<Set<string>>(new Set());

  // Raciones ajustables: las cantidades se recalculan sobre las de la receta
  const [servings, setServings] = useState<number | null>(null);
  const raciones = servings ?? recipe?.servings ?? 2;
  const factor = recipe?.servings ? raciones / recipe.servings : 1;

  const ingredients = useMemo(
    () =>
      recipe?.ingredients.map((i) => ({
        ...i,
        amount: scaleAmount(i.amount, factor),
        status: liveStatus(i, items),
      })) ?? [],
    [recipe, items, factor],
  );

  // Alimentos de la nevera que usa la receta (para "la he cocinado")
  const fridgeMatches = useMemo<FridgeItem[]>(() => {
    const names = ingredients.filter((i) => i.status === "tengo").map((i) => i.name);
    return items.filter((item) => names.some((n) => sameFood(n, item.name)));
  }, [ingredients, items]);

  if (!recipe) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Esta receta ya no está disponible.</p>
        <Link href="/recetas" className="btn btn-primary mt-5">
          Ver recetas
        </Link>
      </div>
    );
  }

  const missing = ingredients.filter((i) => i.status === "falta");

  const addMissing = () => {
    const added = addShopping(missing.map((m) => ({ name: m.name, note: `para ${recipe.title}` })));
    toast(added ? `${added} ${added === 1 ? "cosa añadida" : "cosas añadidas"} a la compra` : "Ya estaba en la lista");
  };

  const share = async () => {
    const text = [
      `${recipe.title} (${recipe.minutes} min · ${raciones} ${raciones === 1 ? "ración" : "raciones"})`,
      "",
      "Ingredientes:",
      ...ingredients.map((i) => `• ${i.name} · ${i.amount}`),
      "",
      "Pasos:",
      ...recipe.steps.map((s, i) => `${i + 1}. ${s}`),
    ].join("\n");

    try {
      if (navigator.share) await navigator.share({ title: recipe.title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast("Receta copiada");
      }
    } catch {
      // El usuario ha cerrado el menú de compartir
    }
  };

  const openCooked = () => {
    // Se marca de entrada solo lo que la receta gasta entero (misma cantidad que en la nevera)
    const amounts = new Map(recipe.ingredients.map((i) => [foodKey(i.name), normalizeName(i.amount)]));
    const finished = fridgeMatches.filter(
      (item) => item.quantity && amounts.get(foodKey(item.name)) === normalizeName(item.quantity),
    );
    setUsed(new Set(finished.map((i) => i.id)));
    setCooking(true);
  };

  const confirmCooked = () => {
    const removed = removeItems([...used], "cocinado");
    setCooking(false);
    toast(
      removed.length ? "¡Que aproveche! Nevera actualizada" : "¡Que aproveche!",
      removed.length ? { label: "Deshacer", run: () => restoreItems(removed) } : undefined,
    );
  };

  return (
    <article>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button className="icon-btn -ml-2" aria-label="Volver" onClick={() => router.back()}>
          <ArrowLeft size={22} />
        </button>
        <button className="icon-btn ml-auto border border-line" aria-label="Compartir receta" onClick={share}>
          <Share2 size={17} />
        </button>
        <button
          className={`btn h-10 min-h-0 px-4 text-sm ${isSaved ? "btn-soft" : "btn-ghost"}`}
          aria-pressed={isSaved}
          onClick={() => {
            toggleSaved(recipe);
            toast(isSaved ? "Quitada de guardadas" : "Receta guardada");
          }}
        >
          <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
          {isSaved ? "Guardada" : "Guardar"}
        </button>
      </div>

      <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-surface text-6xl shadow-card">
        {recipe.emoji}
      </div>
      <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">{recipe.title}</h1>
      <p className="mt-2 text-muted">{recipe.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium">
        <span className="chip">
          <Clock size={15} /> {recipe.minutes} min
        </span>
        <span className="chip capitalize">{recipe.difficulty}</span>
        <span className="chip gap-2 px-2">
          <button
            className="px-1 text-base disabled:opacity-40"
            aria-label="Menos raciones"
            disabled={raciones <= 1}
            // Funcional: si se pulsa rápido varias veces no se pierde ninguna
            onClick={() => setServings((s) => Math.max(1, (s ?? recipe.servings) - 1))}
          >
            −
          </button>
          <Users size={15} />
          <span className="tabular-nums">{raciones}</span>
          <button
            className="px-1 text-base disabled:opacity-40"
            aria-label="Más raciones"
            disabled={raciones >= 12}
            onClick={() => setServings((s) => Math.min(12, (s ?? recipe.servings) + 1))}
          >
            +
          </button>
        </span>
      </div>

      {recipe.uses_expiring.length > 0 && (
        <p className="mt-4 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
          <strong>Aprovecha</strong> {recipe.uses_expiring.join(", ")} antes de que caduque.
        </p>
      )}

      <section className="mt-7" aria-labelledby="ingr">
        <h2 id="ingr" className="section-title mb-2 px-1">
          Ingredientes
        </h2>
        <ul className="card divide-y divide-line">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="font-medium first-letter:uppercase">{ing.name}</span>
                <span className="text-muted"> · {ing.amount}</span>
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[ing.status].cls}`}>
                {STATUS_STYLE[ing.status].label}
              </span>
            </li>
          ))}
        </ul>
        {missing.length > 0 && (
          <button className="btn btn-soft mt-3 w-full" onClick={addMissing}>
            <ShoppingBasket size={18} />
            Añadir lo que falta a la compra ({missing.length})
          </button>
        )}
      </section>

      <section className="mt-7" aria-labelledby="steps">
        <h2 id="steps" className="section-title mb-2 px-1">
          Paso a paso
        </h2>
        <ol className="space-y-2.5">
          {recipe.steps.map((step, i) => {
            const isDone = done.has(i);
            return (
              <li key={i}>
                <button
                  onClick={() =>
                    setDone((d) => {
                      const next = new Set(d);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                  className={`card flex w-full gap-4 p-4 text-left transition-opacity ${isDone ? "opacity-50" : ""}`}
                  aria-pressed={isDone}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display font-bold ${
                      isDone ? "bg-brand text-brand-ink" : "bg-brand-soft text-brand-strong"
                    }`}
                  >
                    {isDone ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`pt-1 leading-relaxed ${isDone ? "line-through" : ""}`}>{step}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 px-1 text-xs text-muted">Toca un paso para tacharlo.</p>
      </section>

      {recipe.tip && (
        <p className="mt-6 flex gap-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand-strong">
          <Lightbulb size={18} className="mt-0.5 shrink-0" />
          {recipe.tip}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-2">
        <button className="btn btn-primary" onClick={() => setCookingMode(true)}>
          <ChefHat size={18} />
          Modo cocina
        </button>
        <button className="btn btn-ghost" onClick={openCooked}>
          <CheckCheck size={18} />
          La he cocinado
        </button>
      </div>

      {cookingMode && (
        <CookingMode
          recipe={recipe}
          ingredients={ingredients}
          onClose={() => setCookingMode(false)}
          onFinish={() => {
            setCookingMode(false);
            openCooked();
          }}
        />
      )}

      <Sheet open={cooking} onClose={() => setCooking(false)} title="¿Qué se ha terminado?">
        {fridgeMatches.length === 0 ? (
          <p className="text-muted">No hay nada de tu nevera que quitar.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">Marca lo que ya no te queda y lo quitamos de la nevera.</p>
            <ul className="card mb-5 divide-y divide-line overflow-hidden">
              {fridgeMatches.map((item) => {
                const checked = used.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      role="checkbox"
                      aria-checked={checked}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                      onClick={() =>
                        setUsed((u) => {
                          const next = new Set(u);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        })
                      }
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                          checked ? "border-brand bg-brand text-brand-ink" : "border-line"
                        }`}
                      >
                        {checked && <Check size={14} strokeWidth={3} />}
                      </span>
                      <EmojiTile emoji={item.emoji} />
                      <span className="flex-1 font-medium first-letter:uppercase">{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <button className="btn btn-primary w-full" onClick={confirmCooked}>
          {used.size ? `Quitar ${used.size} de la nevera` : "Listo"}
        </button>
      </Sheet>
    </article>
  );
}
