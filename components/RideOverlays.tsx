"use client";

import { useEffect, useRef } from "react";
import { smoothstep } from "@/lib/math";
import { getState, subscribe } from "@/lib/store";

/**
 * Overlays ligados al inicio del ride: titular de marca sobre la vista del
 * edificio + hint de scroll. Ambos se desvanecen con el progreso suavizado.
 */
export function RideOverlays() {
  const headRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe(() => {
        const { progress, phase, introT } = getState();
        const ready = phase === "ride";
        if (headRef.current) {
          // Aparece al final de la intro, se va apenas arranca el scroll
          const oIn = ready ? 1 : smoothstep(0.75, 1, introT);
          const oOut = 1 - smoothstep(0.015, 0.09, progress);
          const o = Math.min(oIn, oOut);
          headRef.current.style.opacity = o.toFixed(3);
          headRef.current.style.visibility = o <= 0.01 ? "hidden" : "visible";
        }
        if (hintRef.current) {
          const o = ready ? 1 - smoothstep(0.006, 0.045, progress) : 0;
          hintRef.current.style.opacity = o.toFixed(3);
          hintRef.current.style.visibility = o <= 0.01 ? "hidden" : "visible";
        }
      }),
    [],
  );

  return (
    <>
      <div
        ref={headRef}
        className="scroll-synced pointer-events-none fixed inset-x-0 top-[16%] z-10 flex flex-col items-center px-6 text-center opacity-0"
      >
        <h1 className="sr-only">
          ELEVEN Ascensores — Mantenimiento, instalación y modernización de
          ascensores en Santa Fe
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/eleven-logo.png"
          alt="ELEVEN Ascensores"
          className="w-80 max-w-[85vw] drop-shadow-[0_0_36px_rgba(64,128,224,0.55)] md:w-[560px]"
        />
        <p className="mt-6 max-w-lg text-sm text-steel/85 md:text-base">
          Mantenimiento, instalación y modernización de ascensores para
          consorcios y administradoras de edificios. Atención inmediata las
          24 horas.
        </p>
      </div>

      <div
        ref={hintRef}
        className="scroll-synced pointer-events-none fixed inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 opacity-0"
      >
        <span className="text-[11px] tracking-[0.35em] text-steel/70">
          SCROLLEÁ PARA CONOCERNOS
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" className="animate-bounce text-brand-light" aria-hidden>
          <path d="M12 20 4 9h16L12 20Z" fill="currentColor" />
        </svg>
      </div>
    </>
  );
}
