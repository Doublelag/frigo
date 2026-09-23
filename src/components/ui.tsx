"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus, WifiOff, X } from "lucide-react";
import { expiryLabel, urgency } from "@/lib/dates";
import { useOnline } from "@/lib/online";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[1.45rem] leading-tight font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </header>
  );
}

const URGENCY_STYLE = {
  caducado: "bg-danger text-white",
  urgente: "bg-danger-soft text-danger",
  pronto: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  "sin-fecha": "bg-surface-2 text-muted",
} as const;

export function ExpiryBadge({ days }: { days: number | null }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${URGENCY_STYLE[urgency(days)]}`}
    >
      {expiryLabel(days)}
    </span>
  );
}

export function EmojiTile({ emoji, size = "md" }: { emoji: string; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-16 w-16 text-4xl rounded-2xl" : "h-11 w-11 text-2xl rounded-xl";
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center bg-surface-2 ${cls}`}>
      {emoji}
    </span>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const abrioDesde = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // El tabulador se queda dentro de la hoja mientras está abierta
      if (e.key !== "Tab" || !panel.current) return;
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      abrioDesde?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="Cerrar" className="animate-fade absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-sheet relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-bg px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display text-base font-bold">
            {title}
          </h2>
          <button className="icon-btn -mr-2" aria-label="Cerrar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="chip"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Lista de etiquetas editable: alergias, lo que no gusta, despensa... */
export function TagInput({
  values,
  onChange,
  placeholder,
  suggestions = [],
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const lower = values.map((v) => v.toLowerCase());

  const add = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (v && !lower.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  const pending = suggestions.filter((s) => !lower.includes(s.toLowerCase()));

  return (
    <div className="space-y-3">
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((v) => (
            <li key={v}>
              <button
                type="button"
                className="chip"
                aria-pressed="true"
                aria-label={`Quitar ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
              >
                {v}
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(draft);
        }}
      >
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          enterKeyHint="done"
        />
        <button type="submit" className="btn btn-soft shrink-0 px-4" aria-label="Añadir" disabled={!draft.trim()}>
          <Plus size={18} />
        </button>
      </form>
      {pending.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {pending.map((s) => (
            <li key={s}>
              <button type="button" className="chip text-muted" onClick={() => add(s)}>
                <Plus size={14} />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Se enseña donde hace falta internet: escanear fotos y pedir recetas */
export function OfflineNotice({ children }: { children: React.ReactNode }) {
  const online = useOnline();
  if (online) return null;
  return (
    <p className="mb-4 flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
      <WifiOff size={18} className="shrink-0" />
      {children}
    </p>
  );
}

export function DemoBanner() {
  return (
    <div className="mb-4 rounded-2xl border border-dashed border-warn bg-warn-soft px-4 py-3 text-sm text-warn">
      <strong>Modo demo:</strong> son datos de ejemplo, no lo que hay en tus fotos. Falta conectar la API key de Claude.
    </div>
  );
}

/** Pregunta al servidor si está conectado a Claude; null mientras lo comprueba */
export function useDemoMode(): boolean | null {
  const [demo, setDemo] = useState<boolean | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/estado")
      .then((r) => r.json())
      .then((d) => vivo && setDemo(Boolean(d.demo)))
      .catch(() => vivo && setDemo(null));
    return () => {
      vivo = false;
    };
  }, []);

  return demo;
}
