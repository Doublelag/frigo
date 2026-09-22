"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Camera, ChefHat, Plus, Search } from "lucide-react";
import { ItemEditor } from "@/components/ItemEditor";
import { Onboarding } from "@/components/Onboarding";
import { PixelScreen } from "@/components/PixelArt";
import { QuickAdd } from "@/components/QuickAdd";
import { EmojiTile, ExpiryBadge, PageHeader, Sheet } from "@/components/ui";
import { daysLeft, urgency } from "@/lib/dates";
import { normalizeName, useFrigo } from "@/lib/store";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABEL, type FridgeItem } from "@/lib/types";

type Group = { key: string; title: string; items: (FridgeItem & { days: number | null })[] };

export default function FridgePage() {
  const items = useFrigo((s) => s.items);
  const onboarded = useFrigo((s) => s.onboarded);

  const [editing, setEditing] = useState<FridgeItem | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"caducidad" | "tipo">("caducidad");

  const groups = useMemo<Group[]>(() => {
    const q = normalizeName(query);
    const withDays = items
      .filter((i) => !q || normalizeName(i.name).includes(q))
      .map((i) => ({ ...i, days: daysLeft(i.expiresAt) }))
      .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999) || a.name.localeCompare(b.name));

    if (view === "tipo") {
      return CATEGORIES.map((c) => ({
        key: c,
        title: `${CATEGORY_EMOJI[c]} ${CATEGORY_LABEL[c]}`,
        items: withDays.filter((i) => i.category === c),
      })).filter((g) => g.items.length > 0);
    }

    const now = withDays.filter((i) => ["caducado", "urgente"].includes(urgency(i.days)));
    const week = withDays.filter((i) => urgency(i.days) === "pronto");
    const rest = withDays.filter((i) => ["ok", "sin-fecha"].includes(urgency(i.days)));
    return [
      { key: "now", title: "Úsalo ya", items: now },
      { key: "week", title: "Esta semana", items: week },
      { key: "rest", title: "Con margen", items: rest },
    ].filter((g) => g.items.length > 0);
  }, [items, query, view]);

  const urgentCount = items.filter((i) => ["caducado", "urgente"].includes(urgency(daysLeft(i.expiresAt)))).length;

  // Primera vez: bienvenida a pantalla completa
  if (!onboarded && items.length === 0) return <Onboarding />;

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Tu nevera" />
        <EmptyFridge onAdd={() => setEditing("new")} />
        <AddSheet open={editing !== null} onClose={() => setEditing(null)} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tu nevera"
        subtitle={`${items.length} ${items.length === 1 ? "alimento" : "alimentos"}`}
        action={
          <button className="btn btn-soft h-11 min-h-0 px-4" onClick={() => setEditing("new")}>
            <Plus size={18} />
            Añadir
          </button>
        }
      />

      {urgentCount > 0 && !query && (
        <Link
          href="/recetas?aprovechar=1"
          className="mb-5 flex items-center gap-4 rounded-[1.25rem] bg-brand p-4 text-brand-ink shadow-card transition-transform active:scale-[0.98]"
        >
          <ChefHat size={28} className="shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              {urgentCount === 1 ? "1 cosa caduca" : `${urgentCount} cosas caducan`} en 2 días o menos
            </p>
            <p className="text-sm opacity-85">Ver recetas para aprovecharlas →</p>
          </div>
        </Link>
      )}

      {items.length > 6 && (
        <div role="tablist" className="mb-4 grid grid-cols-2 rounded-full bg-surface-2 p-1">
          {(["caducidad", "tipo"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-full py-2 text-sm font-semibold transition-colors ${
                view === v ? "bg-surface text-ink shadow-card" : "text-muted"
              }`}
            >
              {v === "caducidad" ? "Por caducidad" : "Por tipo"}
            </button>
          ))}
        </div>
      )}

      {items.length > 8 && (
        <div className="relative mb-5">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            className="input pl-11"
            type="search"
            placeholder="Buscar en la nevera"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`g-${g.key}`}>
            <h2 id={`g-${g.key}`} className="section-title mb-2 px-1">
              {g.title} · {g.items.length}
            </h2>
            <ul className="card divide-y divide-line overflow-hidden">
              {g.items.map((item) => (
                <li key={item.id}>
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                    onClick={() => setEditing(item)}
                  >
                    <EmojiTile emoji={item.emoji} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold first-letter:uppercase">{item.name}</span>
                      {item.quantity && <span className="block truncate text-sm text-muted">{item.quantity}</span>}
                    </span>
                    <ExpiryBadge days={item.days} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 && <p className="py-10 text-center text-muted">Nada que coincida con “{query}”.</p>}
      </div>

      {editing === "new" || editing === null ? (
        <AddSheet open={editing === "new"} onClose={() => setEditing(null)} />
      ) : (
        <Sheet open onClose={() => setEditing(null)} title="Editar alimento">
          <ItemEditor key={editing.id} item={editing} onDone={() => setEditing(null)} />
        </Sheet>
      )}
    </>
  );
}

/** Añadir: primero lo típico de un toque, y debajo el formulario completo */
function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Añadir a la nevera">
      <p className="label">Lo de siempre</p>
      <QuickAdd />

      <div className="my-6 flex items-center gap-3 text-xs font-semibold text-muted">
        <span className="h-px flex-1 bg-line" />
        O ALGO CONCRETO
        <span className="h-px flex-1 bg-line" />
      </div>

      <ItemEditor onDone={onClose} />
    </Sheet>
  );
}

function EmptyFridge({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <PixelScreen sprite="fridge" className="mb-5" />
      <h2 className="font-display text-lg font-bold">Aún no sabemos qué tienes</h2>
      <p className="mt-2 max-w-xs text-muted">
        Haz una foto a la nevera abierta y Frigo apuntará los alimentos y cuándo caducan.
      </p>
      <div className="mt-7 flex w-full flex-col gap-3">
        <Link href="/escanear" className="btn btn-primary">
          <Camera size={20} />
          Escanear mi nevera
        </Link>
        <button className="btn btn-ghost" onClick={onAdd}>
          <Plus size={18} />
          Añadir a mano
        </button>
      </div>
    </div>
  );
}
