"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";

const noSubscribe = () => () => {};

/** Evento que dispara Chrome/Android cuando la app se puede instalar */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallState {
  prompt: InstallPromptEvent | null;
  setPrompt: (prompt: InstallPromptEvent | null) => void;
}

export const useInstall = create<InstallState>()((set) => ({
  prompt: null,
  setPrompt: (prompt) => set({ prompt }),
}));

/** true en iPhone/iPad, donde se instala a mano desde "Compartir" */
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/** En el servidor devuelven false, así el HTML inicial coincide con el del navegador */
export const useIsIOS = () => useSyncExternalStore(noSubscribe, isIOS, () => false);
export const useIsInstalled = () => useSyncExternalStore(noSubscribe, isInstalled, () => false);
