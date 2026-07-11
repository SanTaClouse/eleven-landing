"use client";

import { useEffect, useRef } from "react";
import { BUILDING_SHOWCASE } from "@/data/buildings";
import { SERVICES } from "@/data/services";
import { smoothstep } from "@/lib/math";
import { panelWindow } from "@/lib/ridePath";
import { getState, subscribe } from "@/lib/store";

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  SINCRONIZACIÓN scroll ↔ paneles de servicio (punto delicado #2)
 * ══════════════════════════════════════════════════════════════════════════
 *  Cada panel usa la ventana [inStart, inEnd, outStart, outEnd] que expone
 *  panelWindow(i) en lib/ridePath.ts — la MISMA fuente de timing que abre y
 *  cierra las puertas 3D. La opacidad/posición se escribe directo al DOM
 *  (sin re-render de React, sin transiciones CSS) con el progreso YA
 *  suavizado por RigController: texto y puertas respiran juntos.
 *
 *  Los contadores (prueba social) también cuentan con la curva de entrada
 *  del panel: el número "sube" mientras las puertas terminan de abrir.
 * ══════════════════════════════════════════════════════════════════════════
 */
export function ServicePanels() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(
    () =>
      subscribe(() => {
        const { progress, phase } = getState();
        SERVICES.forEach((service, i) => {
          const el = refs.current[i];
          if (!el) return;
          const [inA, inB, outA, outB] = panelWindow(i);
          const enter = smoothstep(inA, inB, progress);
          const o =
            phase === "ride" ? enter - smoothstep(outA, outB, progress) : 0;
          el.style.opacity = o.toFixed(3);
          // Leve deriva vertical: entra subiendo, sale hacia arriba (como
          // si el piso "pasara") — 1→0 de translateY con la misma curva.
          el.style.transform = `translateY(${((1 - o) * 26).toFixed(1)}px)`;
          el.style.visibility = o <= 0.01 ? "hidden" : "visible";

          // Contador de prueba social: cuenta hasta el total con la entrada
          const counter = counterRefs.current[i];
          if (counter && service.stat) {
            const n = Math.round(service.stat.value * enter);
            counter.textContent = `${n}${service.stat.suffix ?? ""}`;
          }
        });
      }),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {SERVICES.map((service, i) => (
        <div
          key={service.title}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="scroll-synced absolute inset-0 flex items-center justify-center px-6 opacity-0"
          aria-hidden
        >
          <article className="glass-panel w-full max-w-xl p-8 text-center md:p-10">
            <p className="mb-4 text-[10px] font-medium tracking-[0.4em] text-brand-light/80">
              NUESTROS SERVICIOS
            </p>
            <h2 className="font-display text-2xl font-semibold leading-snug text-snow md:text-4xl">
              {service.title}
            </h2>
            <div className="chrome-line mx-auto my-5 w-24" />
            <p className="mx-auto max-w-md text-sm leading-relaxed text-steel md:text-base">
              {service.description}
            </p>
            <ul
              className={`mx-auto mt-6 grid w-fit gap-x-8 gap-y-2 text-left ${
                service.highlights.length > 4 ? "sm:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {service.highlights.map((h) => (
                <li
                  key={h}
                  className="flex items-center gap-2 text-xs text-brand-light/90 md:text-sm"
                >
                  <span className="inline-block h-1 w-4 shrink-0 rounded bg-brand" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>

            {service.stat && (
              <div className="mt-8">
                <div className="chrome-line mx-auto mb-6 w-full max-w-sm opacity-60" />
                <span
                  ref={(el) => {
                    counterRefs.current[i] = el;
                  }}
                  className="font-display text-5xl font-semibold leading-none tabular-nums md:text-6xl"
                  style={{
                    color: "#a8ccff",
                    textShadow:
                      "0 0 12px rgba(115,179,247,0.9), 0 0 34px rgba(64,128,224,0.5)",
                  }}
                >
                  0
                </span>
                <p className="mt-2 text-xs tracking-wide text-steel md:text-sm">
                  {service.stat.label}
                </p>

                {service.stat.showcase && (
                  <div className="marquee mt-5 text-xs text-steel/70">
                    <div className="marquee-track">
                      {[...BUILDING_SHOWCASE, ...BUILDING_SHOWCASE].map(
                        (b, k) => (
                          <span key={k} className="mx-3 inline-block">
                            {b}
                            <span className="ml-6 text-brand/60">·</span>
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      ))}
    </div>
  );
}
