"use client";

import { useState } from "react";
import { Trash2, UtensilsCrossed } from "lucide-react";
import { addDays } from "@/lib/dates";
import { useFrigo } from "@/lib/store";
import { toast } from "@/lib/toast";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABEL, type Category, type FridgeItem } from "@/lib/types";

const QUICK_EXPIRY = [
  { label: "Hoy", days: 0 },
  { label: "3 días", days: 3 },
  { label: "1 semana", days: 7 },
  { label: "2 semanas", days: 14 },
  { label: "1 mes", days: 30 },
];

export function ItemEditor({ item, onDone }: { item?: FridgeItem; onDone: () => void }) {
  const upsertItem = useFrigo((s) => s.upsertItem);
  const removeItems = useFrigo((s) => s.removeItems);
  const restoreItems = useFrigo((s) => s.restoreItems);

  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? "");
  const [category, setCategory] = useState<Category>(item?.category ?? "otros");
  const [emoji, setEmoji] = useState(item?.emoji ?? "");
  const [expiresAt, setExpiresAt] = useState<string>(item?.expiresAt ?? "");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    upsertItem({
      id: item?.id,
      name: name.trim().toLowerCase(),
      quantity: quantity.trim(),
      category,
      emoji: emoji.trim() || CATEGORY_EMOJI[category],
      expiresAt: expiresAt || null,
    });
    toast(item ? "Cambios guardados" : `${name.trim()} añadido a la nevera`);
    onDone();
  };

  const remove = (reason: "cocinado" | "tirado") => {
    if (!item) return;
    const removed = removeItems([item.id], reason);
    toast(reason === "cocinado" ? `Gastado: ${item.name}` : `A la basura: ${item.name}`, {
      label: "Deshacer",
      run: () => restoreItems(removed),
    });
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex gap-3">
        <div className="w-20 shrink-0">
          <label className="label" htmlFor="item-emoji">
            Icono
          </label>
          <input
            id="item-emoji"
            className="input text-center text-2xl"
            value={emoji}
            placeholder={CATEGORY_EMOJI[category]}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
          />
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="item-name">
            Alimento
          </label>
          <input
            id="item-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p. ej. pimiento rojo"
            autoFocus={!item}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="item-qty">
          Cantidad
        </label>
        <input
          id="item-qty"
          className="input"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="p. ej. 3, medio kilo, 1 bote"
        />
      </div>

      <div>
        <label className="label" htmlFor="item-cat">
          Tipo
        </label>
        <select
          id="item-cat"
          className="input appearance-none"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="item-exp">
          Caduca
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {QUICK_EXPIRY.map((q) => {
            const date = addDays(q.days);
            return (
              <button
                key={q.label}
                type="button"
                className="chip"
                aria-pressed={expiresAt === date}
                onClick={() => setExpiresAt(date)}
              >
                {q.label}
              </button>
            );
          })}
          <button type="button" className="chip" aria-pressed={expiresAt === ""} onClick={() => setExpiresAt("")}>
            Sin fecha
          </button>
        </div>
        <input
          id="item-exp"
          type="date"
          className="input"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary mt-1 w-full" disabled={!name.trim()}>
        {item ? "Guardar cambios" : "Añadir a la nevera"}
      </button>

      {item && (
        <div className="border-t border-line pt-4">
          <p className="label">Ya no está en la nevera</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => remove("cocinado")}>
              <UtensilsCrossed size={17} />
              Me lo he comido
            </button>
            <button type="button" className="btn btn-danger flex-1" onClick={() => remove("tirado")}>
              <Trash2 size={17} />
              Se ha estropeado
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
