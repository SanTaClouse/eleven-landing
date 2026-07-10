"use client";

import { useEffect, useRef } from "react";
import { SERVICES } from "@/data/services";
import { getState, setState, subscribe } from "@/lib/store";

/**
 * Timeline lateral del recorrido: un punto por parada (PB, pisos 1..4 y la
 * salida al contacto), unidos por un riel que se va llenando. Refleja el
 * stopIndex del stepper y cada punto es un botón: setea requestedStop y el
 * ScrollController ejecuta el viaje completo hasta esa parada.
 *
 * En PC además muestra el nombre del servicio al pasar el mouse; en la
 * parada activa la etiqueta queda fija.
 */

const STOPS: { label: string; name: string }[] = [
  { label: "PB", name: "Entrada" },
  ...SERVICES.map((s) => ({ label: s.floor, name: s.title })),
  { label: "↑", name: "Contacto" },
];

export function FloorTimeline() {
  const rootRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(
    () =>
      subscribe(() => {
        const { phase, stopIndex, stepping } = getState();
        const root = rootRef.current;
        if (!root) return;

        const last = STOPS.length - 1;
        // Visible durante el ride; se despide al llegar al contacto
        const visible = phase === "ride" && !(stopIndex === last && !stepping);
        root.style.opacity = visible ? "1" : "0";
        root.style.pointerEvents = visible ? "" : "none";

        // Riel de progreso: se llena hasta el centro del punto activo,
        // animado por CSS al ritmo del viaje.
        const first = btnRefs.current[0];
        const active = btnRefs.current[stopIndex];
        if (fillRef.current && first && active) {
          fillRef.current.style.height = `${active.offsetTop - first.offsetTop}px`;
        }

        STOPS.forEach((_, i) => {
          const dot = dotRefs.current[i];
          const btn = btnRefs.current[i];
          const label = labelRefs.current[i];
          const isActive = i === stopIndex;
          const isPassed = i < stopIndex;
          if (dot) {
            dot.style.transform = `scale(${isActive ? 1.18 : 1})`;
            dot.style.background = isActive
              ? "rgba(64,128,224,0.95)"
              : isPassed
                ? "rgba(64,128,224,0.35)"
                : "rgba(12,20,36,0.85)";
            dot.style.borderColor = isActive
              ? "rgba(168,204,255,0.95)"
              : isPassed
                ? "rgba(64,128,224,0.55)"
                : "rgba(242,245,250,0.18)";
            dot.style.color = isActive
              ? "#f2f5fa"
              : isPassed
                ? "rgba(242,245,250,0.75)"
                : "rgba(242,245,250,0.38)";
            dot.style.boxShadow = isActive
              ? "0 0 14px rgba(64,128,224,0.85), 0 0 34px rgba(64,128,224,0.35)"
              : "none";
          }
          // Etiqueta fija en el punto activo ("" deja mandar al hover CSS)
          if (label) label.style.opacity = isActive ? "1" : "";
          if (btn) {
            if (isActive) btn.setAttribute("aria-current", "step");
            else btn.removeAttribute("aria-current");
          }
        });
      }),
    [],
  );

  return (
    <nav
      ref={rootRef}
      aria-label="Recorrido por pisos"
      className="pointer-events-none fixed right-1.5 top-1/2 z-20 -translate-y-1/2 opacity-0 transition-opacity duration-500 md:right-8"
    >
      <div
        className="relative flex flex-col items-center gap-2 rounded-full border border-white/10 px-1 py-2 backdrop-blur-md md:gap-3.5 md:px-1.5 md:py-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,20,36,0.55) 0%, rgba(6,10,20,0.55) 100%)",
          boxShadow: "inset 0 1px 0 rgba(242,245,250,0.06)",
        }}
      >
        {/* Riel base: del centro del primer punto al centro del último.
            mobile: botón 24px + py 8px → centros a 20px (top-5)
            md:     botón 28px + py 12px → centros a 26px */}
        <div
          className="absolute left-1/2 top-5 bottom-5 w-px -translate-x-1/2 bg-white/10 md:top-[26px] md:bottom-[26px]"
          aria-hidden
        />
        {/* Riel de progreso (altura en px seteada por la suscripción) */}
        <div
          ref={fillRef}
          className="absolute left-1/2 top-5 w-[2px] -translate-x-1/2 rounded-full transition-[height] duration-[2600ms] ease-in-out md:top-[26px]"
          style={{
            height: 0,
            background:
              "linear-gradient(180deg, rgba(115,179,247,0.9), rgba(64,128,224,0.9))",
            boxShadow: "0 0 8px rgba(64,128,224,0.7)",
          }}
          aria-hidden
        />

        {STOPS.map((stop, i) => (
          <button
            key={stop.name}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            onClick={() => setState({ requestedStop: i })}
            aria-label={`Ir a ${stop.name}`}
            className="group pointer-events-auto relative flex h-6 w-6 items-center justify-center md:h-7 md:w-7"
          >
            <span
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className="flex h-4 w-4 items-center justify-center rounded-full border text-[7px] font-semibold tabular-nums transition-all duration-500 md:h-[22px] md:w-[22px] md:text-[9px]"
              style={{
                background: "rgba(12,20,36,0.85)",
                borderColor: "rgba(242,245,250,0.18)",
                color: "rgba(242,245,250,0.38)",
              }}
            >
              {stop.label}
            </span>
            {/* Etiqueta: fija en el activo, en hover en PC. Oculta en mobile:
                se superpone con el texto del panel en pantallas angostas. */}
            <span
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className="pointer-events-none absolute right-full top-1/2 mr-2.5 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium tracking-wide text-snow opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 md:block"
              style={{
                background: "rgba(6,10,20,0.82)",
                textShadow: "0 1px 6px rgba(3,6,14,0.9)",
              }}
            >
              {stop.name}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
