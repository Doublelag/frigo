"use client";

import { useSyncExternalStore } from "react";
import { useFrigo } from "./store";

/** true cuando los datos guardados en el móvil ya están cargados */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useFrigo.persist.onFinishHydration(onChange),
    () => useFrigo.persist.hasHydrated(),
    () => false,
  );
}
