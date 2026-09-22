"use client";

import { RotateCcw } from "lucide-react";
import { PixelScreen } from "@/components/PixelArt";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <PixelScreen sprite="fridge" className="mb-5" />
      <h1 className="font-display text-lg font-bold">Sin conexión</h1>
      <p className="mt-2 max-w-xs text-muted">
        Tu nevera y tu lista de la compra siguen ahí, pero para escanear fotos o pedir recetas hace falta internet.
      </p>
      <button className="btn btn-primary mt-7" onClick={() => window.location.reload()}>
        <RotateCcw size={18} />
        Reintentar
      </button>
    </div>
  );
}
