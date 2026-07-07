"use client";

import { useEffect, useRef } from "react";
import { rideStateAt } from "@/lib/ridePath";
import { getState, subscribe, useExperience } from "@/lib/store";
import { Display } from "./Display";

function floorLabel(floor: number): string {
  return floor <= 0 ? "PB" : String(Math.min(floor, 5));
}

/**
 * HUD del display de cabina: piso actual + indicador de subida.
 * La opacidad se escribe directo al DOM desde la suscripción al progreso
 * suavizado (mismo valor que mueve la cámara → cero desfase).
 */
export function Hud() {
  const floor = useExperience((s) => s.floor);
  const moving = useExperience((s) => s.moving);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe(() => {
        const el = rootRef.current;
        if (!el) return;
        const { progress, phase } = getState();
        const o = phase === "ride" ? rideStateAt(progress).hudOpacity : 0;
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o <= 0.01 ? "hidden" : "visible";
      }),
    [],
  );

  return (
    <div
      ref={rootRef}
      className="scroll-synced pointer-events-none fixed left-1/2 top-5 z-20 -translate-x-1/2 opacity-0"
    >
      <div
        className="flex items-center gap-4 rounded-2xl border border-brand/25 px-6 py-2.5 backdrop-blur-md"
        style={{
          background: "linear-gradient(180deg, rgba(12,20,36,0.92) 0%, rgba(6,10,20,0.92) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(242,245,250,0.07), inset 0 0 20px rgba(64,128,224,0.12), 0 0 30px rgba(64,128,224,0.22)",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className={`text-brand-light transition-opacity duration-300 ${
            moving ? "animate-pulse opacity-100" : "opacity-25"
          }`}
          aria-hidden
        >
          <path d="M12 4 20 15H4L12 4Z" fill="currentColor" />
        </svg>
        <Display
          value={floorLabel(floor)}
          height={40}
          variant="bare"
          label={`Piso ${floorLabel(floor)}`}
        />
        <span className="text-[9px] font-medium tracking-[0.32em] text-steel/60">
          PISO
        </span>
      </div>
    </div>
  );
}
