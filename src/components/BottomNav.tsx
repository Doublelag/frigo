"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ChefHat, Refrigerator, ShoppingBasket, UserRound } from "lucide-react";
import { useFrigo } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

const TABS = [
  { href: "/", label: "Nevera", icon: Refrigerator },
  { href: "/recetas", label: "Recetas", icon: ChefHat },
  { href: "/escanear", label: "Escanear", icon: Camera, primary: true },
  { href: "/compra", label: "Compra", icon: ShoppingBasket },
  { href: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const pendingCount = useFrigo((s) => s.shopping.filter((i) => !i.checked).length);
  const pending = hydrated ? pendingCount : 0;

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if ("primary" in tab) {
            return (
              <li key={tab.href} className="flex justify-center">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="-mt-6 mb-2 flex h-15 w-15 items-center justify-center rounded-full bg-brand text-brand-ink shadow-card ring-4 ring-bg transition-transform active:scale-95"
                >
                  <Icon size={26} strokeWidth={2.2} />
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold transition-colors ${
                  active ? "text-brand" : "text-muted hover:text-ink"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                {tab.label}
                {tab.href === "/compra" && pending > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-2 min-w-4.5 rounded-full bg-accent px-1 text-center text-[0.65rem] leading-4.5 font-bold text-white">
                    {pending}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
