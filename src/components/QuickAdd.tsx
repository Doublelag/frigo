"use client";

import { Check } from "lucide-react";
import { COMMON_FOODS } from "@/lib/common-foods";
import { addDays } from "@/lib/dates";
import { foodKey, useFrigo } from "@/lib/store";
import { toast } from "@/lib/toast";

/** Rejilla de lo típico: un toque y está en la nevera con su caducidad estimada */
export function QuickAdd() {
  const items = useFrigo((s) => s.items);
  const upsertItem = useFrigo((s) => s.upsertItem);
  const removeItems = useFrigo((s) => s.removeItems);

  const enNevera = new Map(items.map((i) => [foodKey(i.name), i.id]));

  return (
    <ul className="flex flex-wrap gap-2">
      {COMMON_FOODS.map((food) => {
        const id = enNevera.get(foodKey(food.name));
        return (
          <li key={food.name}>
            <button
              type="button"
              className="chip"
              aria-pressed={Boolean(id)}
              onClick={() => {
                if (id) {
                  removeItems([id]);
                  toast(`${food.name} fuera de la lista`);
                  return;
                }
                upsertItem({
                  name: food.name,
                  emoji: food.emoji,
                  category: food.category,
                  quantity: "",
                  expiresAt: addDays(food.days),
                });
                toast(`${food.name} en la nevera`);
              }}
            >
              <span aria-hidden>{food.emoji}</span>
              {food.name}
              {id && <Check size={14} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
