"use client";

import { useEffect } from "react";
import { useInstall } from "@/lib/install";
import { useFrigo } from "@/lib/store";
import { applyTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import { useHydrated } from "@/lib/useHydrated";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <main className="flex-1 px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        {hydrated ? children : <LoadingScreen />}
      </main>
      <BottomNav />
      <Toast />
      <Background />
    </div>
  );
}

/** Tema, service worker (para abrir sin cobertura) y aviso de instalación */
function Background() {
  const setPrompt = useInstall((s) => s.setPrompt);
  const theme = useFrigo((s) => s.theme);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(theme);
    if (theme !== "sistema") return;
    // En modo automático seguimos al sistema mientras la app está abierta
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(theme);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme, hydrated]);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as never);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [setPrompt]);

  useEffect(() => {
    // En desarrollo estorba: cachearía versiones viejas mientras se edita
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker la app funciona igual, solo que no abre sin conexión
    });
  }, []);

  return null;
}

function LoadingScreen() {
  return (
    <div className="space-y-4 pt-2" aria-busy="true" aria-label="Cargando">
      <div className="skeleton h-9 w-40" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-16 w-full" />
    </div>
  );
}

function Toast() {
  const { message, action, key, hide } = useToast();

  useEffect(() => {
    if (!message) return;
    // Con opción de deshacer se deja más rato en pantalla
    const t = setTimeout(hide, action ? 6000 : 2600);
    return () => clearTimeout(t);
  }, [message, action, key, hide]);

  if (!message) return null;
  return (
    <div
      key={key}
      role="status"
      className="animate-fade fixed inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full bg-ink py-2.5 pr-2.5 pl-5 text-center text-sm font-medium text-bg shadow-card bottom-[calc(6.5rem+env(safe-area-inset-bottom))]"
    >
      {message}
      {action && (
        <button
          className="shrink-0 rounded-full bg-bg/15 px-3 py-1.5 font-semibold text-bg underline-offset-2 hover:underline"
          onClick={() => {
            action.run();
            hide();
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
