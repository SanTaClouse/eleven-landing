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
        const { progress, phase, introT, stepping, stopIndex } = getState();
        const ready = phase === "ride";

        // Header: aparece al final de la intro, se desvanece al empezar scroll
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

        // Hint "DESLIZÁ": visible detenido en una parada (no mientras el
        // stepper anima el viaje, no en la salida final). Aparece con un
        // retardo para no parpadear entre piso y piso; se apaga al instante
        // al arrancar el paso — feedback de que el gesto fue tomado.
        if (hintRef.current) {
          const show = ready && !stepping && stopIndex < 5;
          hintRef.current.style.opacity = show ? "1" : "0";
          hintRef.current.style.transitionDelay = show ? "900ms" : "0ms";
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
        className="scroll-synced pointer-events-none fixed inset-x-0 z-10 flex flex-col items-center gap-2 opacity-0 transition-opacity duration-500"
        style={{ bottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-col gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" className="animate-bounce text-brand-light mx-auto" aria-hidden>
              <path d="M12 20 4 9h16L12 20Z" fill="currentColor" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" className="animate-bounce text-brand-light mx-auto" style={{ animationDelay: "0.15s" }} aria-hidden>
              <path d="M12 20 4 9h16L12 20Z" fill="currentColor" />
            </svg>
          </div>
          <span
            className="text-[10px] font-semibold tracking-[0.3em] text-snow/80 md:text-xs"
            style={{ textShadow: "0 1px 6px rgba(3,6,14,0.9)" }}
          >
            DESLIZÁ
          </span>
        </div>
      </div>
    </>
  );
}
