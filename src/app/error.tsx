"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { PixelScreen } from "@/components/PixelArt";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[frigo] error en la pantalla:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <PixelScreen sprite="fridge" className="mb-5" />
      <h1 className="font-display text-lg font-bold">Se ha atascado algo</h1>
      <p className="mt-2 max-w-xs text-muted">
        Tus datos siguen guardados en el móvil. Prueba a volver a cargar esta pantalla.
      </p>
      <div className="mt-7 flex w-full max-w-xs flex-col gap-2">
        <button className="btn btn-primary" onClick={reset}>
          <RotateCcw size={18} />
          Reintentar
        </button>
        <Link href="/" className="btn btn-ghost">
          Ir a mi nevera
        </Link>
      </div>
    </div>
  );
}
