import Link from "next/link";
import { PixelScreen } from "@/components/PixelArt";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <PixelScreen sprite="fridge" className="mb-5" />
      <h1 className="font-display text-lg font-bold">Aquí no hay nada</h1>
      <p className="mt-2 max-w-xs text-muted">Esta pantalla no existe o ya no está.</p>
      <Link href="/" className="btn btn-primary mt-7">
        Ir a mi nevera
      </Link>
    </div>
  );
}
