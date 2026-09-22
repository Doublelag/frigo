"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { useFrigo } from "@/lib/store";
import type { Diet } from "@/lib/types";
import { PixelArt } from "./PixelArt";
import { Chips, TagInput } from "./ui";

const DIETS: { value: Diet; label: string }[] = [
  { value: "omnivora", label: "Como de todo" },
  { value: "vegetariana", label: "Vegetariana" },
  { value: "vegana", label: "Vegana" },
  { value: "pescetariana", label: "Pescetariana" },
];

const ALLERGENS = ["gluten", "lactosa", "huevo", "frutos secos", "marisco", "pescado", "soja"];

/** Tres pantallas la primera vez: qué es, cómo comes y a escanear */
export function Onboarding() {
  const router = useRouter();
  const prefs = useFrigo((s) => s.prefs);
  const setPrefs = useFrigo((s) => s.setPrefs);
  const finishOnboarding = useFrigo((s) => s.finishOnboarding);

  const [step, setStep] = useState(0);

  const close = (goScan: boolean) => {
    finishOnboarding();
    if (goScan) router.push("/escanear");
  };

  return (
    <div className="animate-fade fixed inset-0 z-60 flex flex-col bg-bg px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-surface-2"}`} />
          ))}
        </div>

        <div className="flex flex-1 flex-col justify-center">
          {step === 0 && (
            <div className="text-center">
              <span className="mb-6 inline-flex rounded-3xl border-4 border-[#0c3722] bg-[#cfe3d2] p-4">
                <PixelArt sprite="fridge" size={120} />
              </span>
              <h1 className="font-display text-2xl font-bold">{APP_NAME}</h1>
              <p className="mt-3 text-lg text-muted">
                Haz una foto a tu nevera y te digo qué cocinar con lo que hay, antes de que caduque.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-lg font-bold">¿Cómo comes?</h2>
              <p className="mt-2 mb-5 text-muted">Ninguna receta se saltará esto. Se puede cambiar cuando quieras.</p>

              <p className="label">Dieta</p>
              <Chips label="Dieta" options={DIETS} value={prefs.diet} onChange={(diet) => setPrefs({ diet })} />

              <p className="label mt-6">Alergias e intolerancias</p>
              <TagInput
                values={prefs.allergies}
                onChange={(allergies) => setPrefs({ allergies })}
                placeholder="Otra alergia…"
                suggestions={ALLERGENS}
              />
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <span className="mb-6 inline-flex rounded-3xl border-4 border-[#0c3722] bg-[#cfe3d2] p-4">
                <PixelArt sprite="camera" size={120} />
              </span>
              <h2 className="font-display text-lg font-bold">Vamos a llenar tu nevera</h2>
              <p className="mt-3 text-muted">
                Abre la nevera, haz una o varias fotos y yo apunto lo que hay y cuándo caduca. También sirve el ticket
                del súper.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          {step < 2 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {step === 0 ? "Empezar" : "Seguir"}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => close(true)}>
              <Camera size={18} />
              Escanear mi nevera
            </button>
          )}
          <button className="btn text-muted" onClick={() => close(false)}>
            {step < 2 ? "Saltar" : "Ahora no"}
          </button>
        </div>
      </div>
    </div>
  );
}
