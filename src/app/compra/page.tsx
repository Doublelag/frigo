"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus, Refrigerator, Share2, Trash2, X } from "lucide-react";
import { PixelScreen } from "@/components/PixelArt";
import { groupByAisle } from "@/lib/aisles";
import { PageHeader } from "@/components/ui";
import { useFrigo } from "@/lib/store";
import { toast } from "@/lib/toast";
import { CATEGORY_EMOJI, type ShoppingItem } from "@/lib/types";

export default function ShoppingPage() {
  const shopping = useFrigo((s) => s.shopping);
  const addShopping = useFrigo((s) => s.addShopping);
  const toggleShopping = useFrigo((s) => s.toggleShopping);
  const removeShopping = useFrigo((s) => s.removeShopping);
  const clearChecked = useFrigo((s) => s.clearCheckedShopping);
  const upsertItem = useFrigo((s) => s.upsertItem);

  const [draft, setDraft] = useState("");

  const pending = shopping.filter((s) => !s.checked);
  const inCart = shopping.filter((s) => s.checked);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (addShopping([{ name: draft }]) === 0 && draft.trim()) toast("Ya está en la lista");
    setDraft("");
  };

  const moveToFridge = () => {
    for (const s of inCart) {
      upsertItem({
        name: s.name.toLowerCase(),
        quantity: "",
        category: "otros",
        emoji: CATEGORY_EMOJI.otros,
        expiresAt: null,
      });
    }
    clearChecked();
    toast(`${inCart.length} ${inCart.length === 1 ? "cosa pasada" : "cosas pasadas"} a la nevera`);
  };

  const share = async () => {
    const lista =
      pending.length < 5
        ? pending.map((s) => `• ${s.name}`).join("\n")
        : groupByAisle(pending, (i) => i.name)
            .map(([aisle, items]) => `${aisle}:\n${items.map((i) => `• ${i.name}`).join("\n")}`)
            .join("\n\n");
    const text = `Lista de la compra:\n${lista}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast("Lista copiada");
      }
    } catch {
      // El usuario ha cerrado el menú de compartir
    }
  };

  return (
    <>
      <PageHeader
        title="Compra"
        subtitle={pending.length ? `${pending.length} por comprar` : "Nada pendiente"}
        action={
          pending.length > 0 && (
            <button className="icon-btn border border-line" aria-label="Compartir lista" onClick={share}>
              <Share2 size={18} />
            </button>
          )
        }
      />

      <form onSubmit={add} className="mb-5 flex gap-2">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Añadir algo a la lista"
          enterKeyHint="done"
        />
        <button type="submit" className="btn btn-primary shrink-0 px-4" aria-label="Añadir" disabled={!draft.trim()}>
          <Plus size={20} />
        </button>
      </form>

      {shopping.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center text-muted">
          <PixelScreen sprite="basket" />
          <p className="mt-3">
            La lista está vacía. Desde cada receta puedes
            <br />
            añadir lo que te falta con un toque.
          </p>
        </div>
      )}

      {/* Con pocas cosas, lista simple; con muchas, por secciones del súper */}
      {pending.length > 0 &&
        (pending.length < 5 ? (
          <ul className="card divide-y divide-line overflow-hidden">
            {pending.map((s) => (
              <Row key={s.id} item={s} onToggle={toggleShopping} onRemove={removeShopping} />
            ))}
          </ul>
        ) : (
          <div className="space-y-5">
            {groupByAisle(pending, (i) => i.name).map(([aisle, items]) => (
              <section key={aisle}>
                <h2 className="section-title mb-2 px-1">
                  {aisle} · {items.length}
                </h2>
                <ul className="card divide-y divide-line overflow-hidden">
                  {items.map((s) => (
                    <Row key={s.id} item={s} onToggle={toggleShopping} onRemove={removeShopping} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ))}

      {inCart.length > 0 && (
        <section className="mt-7" aria-labelledby="cart">
          <h2 id="cart" className="section-title mb-2 px-1">
            En el carro · {inCart.length}
          </h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {inCart.map((s) => (
              <Row key={s.id} item={s} onToggle={toggleShopping} onRemove={removeShopping} />
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-soft flex-1" onClick={moveToFridge}>
              <Refrigerator size={18} />
              Pasar a la nevera
            </button>
            <button className="btn btn-ghost" aria-label="Borrar lo comprado" onClick={clearChecked}>
              <Trash2 size={18} />
            </button>
          </div>
          <p className="mt-3 px-1 text-xs text-muted">
            Consejo: si{" "}
            <Link href="/escanear" className="font-semibold text-brand underline">
              escaneas la compra
            </Link>{" "}
            al llegar a casa, Frigo calcula también cuándo caduca cada cosa.
          </p>
        </section>
      )}
    </>
  );
}

function Row({
  item,
  onToggle,
  onRemove,
}: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-1 pr-1">
      <button
        role="checkbox"
        aria-checked={item.checked}
        onClick={() => onToggle(item.id)}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            item.checked ? "border-brand bg-brand text-brand-ink" : "border-line"
          }`}
        >
          {item.checked && <Check size={14} strokeWidth={3} />}
        </span>
        <span className="min-w-0">
          <span
            className={`block truncate font-medium first-letter:uppercase ${item.checked ? "text-muted line-through" : ""}`}
          >
            {item.name}
          </span>
          {item.note && <span className="block truncate text-xs text-muted">{item.note}</span>}
        </span>
      </button>
      <button className="icon-btn text-muted" aria-label={`Quitar ${item.name}`} onClick={() => onRemove(item.id)}>
        <X size={18} />
      </button>
    </li>
  );
}
