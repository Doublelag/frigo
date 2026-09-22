"use client";

import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { liveStatus, useFrigo } from "@/lib/store";
import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const items = useFrigo((s) => s.items);
  const missing = recipe.ingredients.filter((i) => liveStatus(i, items) === "falta").length;

  return (
    <Link
      href={`/receta?id=${encodeURIComponent(recipe.id)}`}
      className="card flex gap-4 p-4 transition-transform active:scale-[0.98]"
    >
      <span
        aria-hidden
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-4xl"
      >
        {recipe.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.05rem] leading-snug font-bold">{recipe.title}</span>
        <span className="mt-1 line-clamp-2 block text-sm text-muted">{recipe.description}</span>
        <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={14} /> {recipe.minutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} /> {recipe.servings}
          </span>
          <span className="capitalize">{recipe.difficulty}</span>
        </span>
        <span className="mt-2.5 flex flex-wrap gap-1.5">
          {missing === 0 ? (
            <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok">Tienes todo</span>
          ) : (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
              {missing === 1 ? "Falta 1 cosa" : `Faltan ${missing} cosas`}
            </span>
          )}
          {recipe.uses_expiring.length > 0 && (
            <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
              Aprovecha {recipe.uses_expiring.slice(0, 2).join(" y ")}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
