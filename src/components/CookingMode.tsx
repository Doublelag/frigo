"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useWakeLock } from "@/lib/wakeLock";
import type { Recipe, RecipeIngredient } from "@/lib/types";

/**
 * Pantalla completa para cocinar: paso a paso, letra grande y la pantalla del
 * móvil no se apaga mientras tanto.
 */
export function CookingMode({
  recipe,
  ingredients,
  onClose,
  onFinish,
}: {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  onClose: () => void;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(-1); // -1 = ingredientes
  const total = recipe.steps.length;
  useWakeLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, total - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, -1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, total]);

  const last = step === total - 1;

  return (
    <div className="animate-fade fixed inset-0 z-60 flex flex-col bg-bg">
      <header className="flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-muted">{recipe.title}</p>
        <button className="icon-btn -mr-2" aria-label="Salir del modo cocina" onClick={onClose}>
          <X size={22} />
        </button>
      </header>

      {/* Barra de progreso */}
      <div className="flex gap-1 px-4 pb-4">
        {recipe.steps.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-surface-2"}`} />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 pb-4">
        {step === -1 ? (
          <div>
            <p className="section-title mb-3">Ten preparado</p>
            <ul className="space-y-2">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-2 text-lg">
                  <span className="text-brand">•</span>
                  <span className="first-letter:uppercase">{ing.name}</span>
                  <span className="text-muted">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="section-title mb-3">
              Paso {step + 1} de {total}
            </p>
            <p className="font-display text-xl leading-relaxed">{recipe.steps[step]}</p>
          </div>
        )}
      </div>

      <footer className="flex items-center gap-3 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button
          className="btn btn-ghost"
          onClick={() => setStep((s) => Math.max(s - 1, -1))}
          disabled={step === -1}
          aria-label="Paso anterior"
        >
          <ChevronLeft size={20} />
        </button>
        {last ? (
          <button className="btn btn-primary flex-1" onClick={onFinish}>
            Listo, ya está
          </button>
        ) : (
          <button className="btn btn-primary flex-1" onClick={() => setStep((s) => Math.min(s + 1, total - 1))}>
            {step === -1 ? "Empezar" : "Siguiente"}
            <ChevronRight size={20} />
          </button>
        )}
      </footer>
    </div>
  );
}
