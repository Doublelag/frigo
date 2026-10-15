"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, RotateCcw, X } from "lucide-react";
import { PixelScreen } from "@/components/PixelArt";
import { DemoBanner, EmojiTile, ExpiryBadge, OfflineNotice, PageHeader, useDemoMode } from "@/components/ui";
import { detectFoods } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import { prepareImage, type PreparedImage } from "@/lib/image";
import { foodKey, useFrigo } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { DetectedItem } from "@/lib/types";

const MAX_PHOTOS = 4;

const LOADING_STEPS = ["Mirando las baldas…", "Leyendo etiquetas…", "Calculando caducidades…", "Casi está…"];

type Row = DetectedItem & { key: string; selected: boolean };

export default function ScanPage() {
  const router = useRouter();
  const existing = useFrigo((s) => s.items);
  const addDetected = useFrigo((s) => s.addDetected);

  const [photos, setPhotos] = useState<PreparedImage[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [source, setSource] = useState<"nevera" | "ticket">("nevera");
  const demoMode = useDemoMode();

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2500);
    return () => clearInterval(t);
  }, [loading]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setPreparing(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const picked = Array.from(files).slice(0, room);
      const prepared = await Promise.all(picked.map(prepareImage));
      setPhotos((p) => [...p, ...prepared]);
      if (files.length > room) toast(`Máximo ${MAX_PHOTOS} fotos por escaneo`);
    } catch {
      setError("No se ha podido leer alguna foto. Prueba con otra.");
    } finally {
      setPreparing(false);
    }
  };

  const detect = async () => {
    setStep(0);
    setLoading(true);
    setError(null);
    try {
      const res = await detectFoods(photos, source);
      setDemo(res.demo);
      setRows(
        res.items.map((item, i) => ({ ...item, key: `${i}-${item.name}`, selected: item.confidence !== "baja" })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha ido mal. Prueba otra vez.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhotos([]);
    setRows(null);
    setError(null);
  };

  const save = () => {
    if (!rows) return;
    const chosen = rows.filter((r) => r.selected && r.name.trim());
    addDetected(
      chosen.map((r) => ({
        name: r.name.trim().toLowerCase(),
        emoji: r.emoji,
        category: r.category,
        quantity: r.quantity.trim(),
        days_left: r.days_left,
        expiry_source: r.expiry_source,
        confidence: r.confidence,
      })),
    );
    toast(`${chosen.length} ${chosen.length === 1 ? "alimento guardado" : "alimentos guardados"} en tu nevera`);
    router.push("/");
  };

  /* ---------- Revisión de lo detectado ---------- */
  if (rows) {
    const known = new Set(existing.map((i) => foodKey(i.name)));
    const selectedCount = rows.filter((r) => r.selected).length;

    return (
      <>
        <PageHeader
          title="¿Está bien?"
          subtitle="Quita lo que sobre y corrige nombres o cantidades antes de guardar."
        />
        {demo && <DemoBanner />}

        {rows.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-semibold">No hemos visto comida en las fotos.</p>
            <p className="mt-1 text-sm text-muted">Prueba con la nevera abierta y buena luz.</p>
            <button className="btn btn-primary mt-5" onClick={reset}>
              <RotateCcw size={18} />
              Volver a intentarlo
            </button>
          </div>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {rows.map((row) => (
              <li key={row.key} className={`flex items-center gap-3 px-3 py-3 ${row.selected ? "" : "opacity-50"}`}>
                <button
                  role="checkbox"
                  aria-checked={row.selected}
                  aria-label={`Incluir ${row.name}`}
                  onClick={() =>
                    setRows((rs) => rs!.map((r) => (r.key === row.key ? { ...r, selected: !r.selected } : r)))
                  }
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                    row.selected ? "border-brand bg-brand text-brand-ink" : "border-line"
                  }`}
                >
                  {row.selected && <Check size={16} strokeWidth={3} />}
                </button>
                <EmojiTile emoji={row.emoji} />
                <div className="min-w-0 flex-1 space-y-1">
                  <input
                    aria-label="Nombre"
                    className="w-full bg-transparent font-semibold outline-none focus:underline"
                    value={row.name}
                    onChange={(e) =>
                      setRows((rs) => rs!.map((r) => (r.key === row.key ? { ...r, name: e.target.value } : r)))
                    }
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <input
                      aria-label="Cantidad"
                      className="w-28 bg-transparent text-sm text-muted outline-none focus:underline"
                      value={row.quantity}
                      onChange={(e) =>
                        setRows((rs) => rs!.map((r) => (r.key === row.key ? { ...r, quantity: e.target.value } : r)))
                      }
                    />
                    {known.has(foodKey(row.name)) && (
                      <span className="text-xs font-medium text-brand">ya lo tenías · se actualiza</span>
                    )}
                    {row.confidence === "baja" && <span className="text-xs font-medium text-warn">¿seguro?</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ExpiryBadge days={row.days_left} />
                  <span className="text-[0.7rem] text-muted">
                    {row.expiry_source === "etiqueta" ? "según etiqueta" : "estimado"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length > 0 && (
          <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] mt-5 flex gap-3">
            <button className="btn btn-ghost bg-bg" onClick={reset} aria-label="Descartar y volver a escanear">
              <RotateCcw size={18} />
            </button>
            <button className="btn btn-primary flex-1 shadow-card" disabled={selectedCount === 0} onClick={save}>
              Guardar {selectedCount} en la nevera
            </button>
          </div>
        )}
      </>
    );
  }

  /* ---------- Hacer fotos ---------- */
  return (
    <>
      <PageHeader
        title="Escanear"
        subtitle={
          source === "nevera"
            ? "Nevera abierta, puerta, cajón de la verdura… hasta 4 fotos."
            : "Foto al ticket del súper y se apunta toda la compra."
        }
      />

      <div role="tablist" className="mb-5 grid grid-cols-2 rounded-full bg-surface-2 p-1">
        {(["nevera", "ticket"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={source === s}
            onClick={() => setSource(s)}
            className={`rounded-full py-2 text-sm font-semibold transition-colors ${
              source === s ? "bg-surface text-ink shadow-card" : "text-muted"
            }`}
          >
            {s === "nevera" ? "Mi nevera" : "Ticket de compra"}
          </button>
        ))}
      </div>

      {/* Se avisa ANTES de hacer fotos: en demo no se miran las fotos de verdad */}
      {demoMode && <DemoBanner />}

      <OfflineNotice>
        Sin conexión no se pueden analizar fotos. Puedes añadir alimentos a mano mientras tanto.
      </OfflineNotice>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {photos.length === 0 ? (
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={preparing}
          className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-[1.75rem] border-2 border-dashed border-line bg-surface text-center transition-colors hover:border-brand"
        >
          <PixelScreen sprite="camera" size={104} />
          <span>
            <span className="block font-display text-base font-bold">Hacer una foto</span>
            <span className="mt-1 block text-sm text-muted">
              {source === "nevera" ? "Con buena luz y la puerta bien abierta" : "El ticket estirado y enfocado"}
            </span>
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- es una data URL local */}
              <img src={p.previewUrl} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {loading && <div className="scan-line" />}
              {!loading && (
                <button
                  aria-label={`Quitar foto ${i + 1}`}
                  onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && !loading && (
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-muted hover:border-brand hover:text-brand"
            >
              <Camera size={28} />
              <span className="text-sm font-semibold">Otra foto</span>
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {photos.length > 0 && (
          <button className="btn btn-primary w-full" disabled={loading || preparing} onClick={detect}>
            {loading ? LOADING_STEPS[step] : `Ver qué hay (${photos.length} ${photos.length === 1 ? "foto" : "fotos"})`}
          </button>
        )}
        {!loading && photos.length < MAX_PHOTOS && (
          <button className="btn btn-ghost w-full" disabled={preparing} onClick={() => galleryRef.current?.click()}>
            <ImagePlus size={18} />
            {preparing ? "Preparando fotos…" : "Elegir de la galería"}
          </button>
        )}
        <p className="px-2 pt-1 text-center text-xs text-muted">
          También sirve con la bolsa de la compra o la despensa. {APP_NAME} no guarda tus fotos.
        </p>
      </div>
    </>
  );
}
