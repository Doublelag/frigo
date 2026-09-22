"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PixelArt } from "@/components/PixelArt";
import { APP_NAME } from "@/lib/brand";

export default function EntrarPage() {
  return (
    <Suspense>
      <Entrar />
    </Suspense>
  );
}

/** Pantalla de entrada de la beta: una palabra y dentro */
function Entrar() {
  const router = useRouter();
  const volver = useSearchParams().get("volver") || "/";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No ha podido ser. Prueba otra vez.");
        return;
      }
      router.replace(volver);
      router.refresh();
    } catch {
      setError("Sin conexión. Revisa internet y prueba otra vez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center text-center">
      <span className="mb-6 inline-flex rounded-3xl border-4 border-[#0c3722] bg-[#cfe3d2] p-4">
        <PixelArt sprite="fridge" size={104} />
      </span>

      <h1 className="font-display text-xl font-bold">{APP_NAME}</h1>
      <p className="mt-3 max-w-xs text-muted">
        Está en pruebas cerradas. Escribe el código que te han pasado para entrar.
      </p>

      <form onSubmit={enviar} className="mt-7 w-full max-w-xs space-y-3">
        <input
          className="input text-center"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="go"
          aria-label="Código de la beta"
        />
        <button type="submit" className="btn btn-primary w-full" disabled={!code.trim() || sending}>
          {sending ? "Comprobando…" : "Entrar"}
          {!sending && <ArrowRight size={18} />}
        </button>
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
