"use client";

import { useEffect, useRef } from "react";
import { smoothstep } from "@/lib/math";
import { getState, subscribe } from "@/lib/store";

/**
 * Overlays ligados al inicio del ride: titular de marca sobre la vista del
 * edificio + hint de scroll. Ambos se desvanecen con el progreso suavizado.
 * Un scrim degradado oscurece la parte alta del 3D mientras el titular está
 * visible, para que logo y texto contrasten sin apagar la escena.
 */
export function RideOverlays() {
  const headRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe(() => {
        const { progress, phase, introT } = getState();
        const ready = phase === "ride";
        // Aparece al final de la intro, se va apenas arranca el scroll
        const oIn = ready ? 1 : smoothstep(0.75, 1, introT);
        const oOut = 1 - smoothstep(0.015, 0.09, progress);
        const o = Math.min(oIn, oOut);
        if (headRef.current) {
          headRef.current.style.opacity = o.toFixed(3);
          headRef.current.style.visibility = o <= 0.01 ? "hidden" : "visible";
        }
        if (scrimRef.current) {
          scrimRef.current.style.opacity = o.toFixed(3);
          scrimRef.current.style.visibility = o <= 0.01 ? "hidden" : "visible";
        }
        if (hintRef.current) {
          const oh = ready ? 1 - smoothstep(0.006, 0.045, progress) : 0;
          hintRef.current.style.opacity = oh.toFixed(3);
          hintRef.current.style.visibility = oh <= 0.01 ? "hidden" : "visible";
        }
      }),
    [],
  );

  return (
    <>
      {/* Scrim: oscurece la mitad superior del 3D mientras hay titular */}
      <div
        ref={scrimRef}
        className="scroll-synced pointer-events-none fixed inset-x-0 top-0 z-[9] h-[62vh] opacity-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,14,26,0.9) 0%, rgba(10,14,26,0.62) 45%, rgba(10,14,26,0) 100%)",
        }}
        aria-hidden
      />

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
          className="w-80 max-w-[85vw] md:w-[560px]"
          style={{
            filter:
              "drop-shadow(0 4px 14px rgba(3,6,14,0.95)) drop-shadow(0 0 34px rgba(64,128,224,0.6))",
          }}
        />
        <p
          className="mt-6 max-w-lg text-sm font-medium text-snow md:text-base"
          style={{ textShadow: "0 1px 10px rgba(3,6,14,0.9), 0 0 26px rgba(3,6,14,0.6)" }}
        >
          Mantenimiento, instalación y modernización de ascensores para
          consorcios y administradoras de edificios. Atención inmediata las
          24 horas.
        </p>
      </div>

      <div
        ref={hintRef}
        className="scroll-synced pointer-events-none fixed inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 opacity-0"
      >
        <span
          className="text-[11px] tracking-[0.35em] text-snow/80"
          style={{ textShadow: "0 1px 8px rgba(3,6,14,0.9)" }}
        >
          SCROLLEÁ PARA CONOCERNOS
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" className="animate-bounce text-brand-light" aria-hidden>
          <path d="M12 20 4 9h16L12 20Z" fill="currentColor" />
        </svg>
      </div>
    </>
  );
}
