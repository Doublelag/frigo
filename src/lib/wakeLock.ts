"use client";

import { useEffect } from "react";

/**
 * Mantiene la pantalla encendida mientras se cocina (como hacen las apps de
 * recetas). Si el navegador no lo admite, simplemente no hace nada.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // El navegador puede negarlo (batería baja, pestaña en segundo plano)
      }
    };

    // Al volver a la app desde otra pantalla hay que volver a pedirlo
    const onVisible = () => {
      if (!cancelled && document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
