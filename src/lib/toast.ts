"use client";

import { create } from "zustand";

export interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastState {
  message: string | null;
  action: ToastAction | null;
  key: number;
  show: (message: string, action?: ToastAction) => void;
  hide: () => void;
}

export const useToast = create<ToastState>()((set) => ({
  message: null,
  action: null,
  key: 0,
  show: (message, action) => set((s) => ({ message, action: action ?? null, key: s.key + 1 })),
  hide: () => set({ message: null, action: null }),
}));

export const toast = (message: string, action?: ToastAction) => useToast.getState().show(message, action);
