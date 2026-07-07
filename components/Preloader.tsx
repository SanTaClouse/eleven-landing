"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { playClick, playDing, playTick } from "@/lib/audio";
import { getState, setState, useExperience } from "@/lib/store";
import { ArrowUpIcon, ElevatorButton } from "./CallButton";
import { Display } from "./Display";

const RING_R = 62;
const RING_C = 2 * Math.PI * RING_R;
/** Piso desde el que "baja" la cabina al llamarla (el último del edificio) */
const START_FLOOR = 5;

/**
 * Pantalla inicial: logo + botón de llamada con aro de progreso de carga.
 * Al click: display 7-seg cuenta 8 → PB (GSAP), suena el "ding" y arranca
 * el barrido de cámara (fase "arriving").
 */
export function Preloader() {
  const phase = useExperience((s) => s.phase);
  const sceneReady = useExperience((s) => s.sceneReady);
  const [gone, setGone] = useState(false);
  const [countdown, setCountdown] = useState(String(START_FLOOR));

  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const ringVal = useRef({ v: 0 });
  const mountedAt = useRef(0);

  const drawRing = () => {
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = String(
        RING_C * (1 - ringVal.current.v / 100),
      );
    }
  };

  // Aro de progreso: avanza "optimista" hasta 88% mientras compila la escena
  useEffect(() => {
    mountedAt.current = performance.now();
    const tween = gsap.to(ringVal.current, {
      v: 88,
      duration: 1.4,
      ease: "power1.inOut",
      onUpdate: drawRing,
    });
    return () => {
      tween.kill();
    };
  }, []);

  // Escena lista → completar el aro y habilitar el botón
  useEffect(() => {
    if (!sceneReady || getState().phase !== "loading") return;
    const elapsed = (performance.now() - mountedAt.current) / 1000;
    gsap.killTweensOf(ringVal.current);
    const tween = gsap.to(ringVal.current, {
      v: 100,
      duration: 0.5,
      delay: Math.max(0, 1.1 - elapsed), // que la carga nunca se sienta "falsa"
      ease: "power2.out",
      onUpdate: drawRing,
      onComplete: () => setState({ phase: "ready" }),
    });
    return () => {
      tween.kill();
    };
  }, [sceneReady]);

  // Fase "arriving" → desvanecer el preloader y ceder el control a la escena
  useEffect(() => {
    if (phase !== "arriving" || !rootRef.current) return;
    const tween = gsap.to(rootRef.current, {
      autoAlpha: 0,
      duration: 0.8,
      delay: 0.15,
      ease: "power2.inOut",
      onComplete: () => setGone(true),
    });
    return () => {
      tween.kill();
    };
  }, [phase]);

  const call = () => {
    if (getState().phase !== "ready") return;
    playClick();
    setState({ phase: "calling" });
    // Cuenta regresiva del display: 8 → 1 → PB, con desaceleración al final.
    // Cada cambio de piso emite un beep sutil de display (lastN evita
    // repetir el tick dentro del mismo número).
    const obj = { f: START_FLOOR };
    let lastN = START_FLOOR + 1;
    gsap.to(obj, {
      f: 0,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        const n = Math.ceil(obj.f);
        if (n !== lastN) {
          lastN = n;
          if (n > 0) playTick();
        }
        setCountdown(n <= 0 ? "PB" : String(n));
      },
      onComplete: () => {
        playDing(); // 🔔 la cabina llegó a planta baja
        gsap.delayedCall(0.55, () => setState({ phase: "arriving" }));
      },
    });
  };

  if (gone) return null;

  const calling = phase === "calling" || phase === "arriving";

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-ink"
    >
      {/* Luz ambiental sutil de fondo */}
      <div
        aria-hidden
        className="animate-drift-slow absolute -left-1/4 top-[-20%] h-[70vh] w-[70vw] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(26,84,182,0.35) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="animate-drift-slow absolute bottom-[-25%] right-[-15%] h-[60vh] w-[55vw] rounded-full opacity-30 blur-3xl"
        style={{
          animationDelay: "-7s",
          background:
            "radial-gradient(circle, rgba(64,128,224,0.28) 0%, transparent 65%)",
        }}
      />

      {/* Logo discreto arriba */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/eleven-logo.png"
        alt="ELEVEN Ascensores"
        className="absolute top-10 h-16 w-auto drop-shadow-[0_0_26px_rgba(64,128,224,0.5)] md:h-24"
      />

      {calling ? (
        <div className="flex flex-col items-center gap-8">
          <Display value={countdown} height={140} label={`Piso ${countdown}`} />
          <p className="text-sm tracking-[0.35em] text-steel/80">
            {countdown === "PB" ? "EN PLANTA BAJA" : "LLAMANDO ASCENSOR"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-7">
          <div className="relative flex items-center justify-center">
            {/* Aro de progreso de precarga alrededor del botón */}
            <svg
              width={(RING_R + 8) * 2}
              height={(RING_R + 8) * 2}
              className="absolute -rotate-90"
              aria-hidden
            >
              <circle
                cx={RING_R + 8}
                cy={RING_R + 8}
                r={RING_R}
                fill="none"
                stroke="rgba(64,128,224,0.15)"
                strokeWidth="3"
              />
              <circle
                ref={ringRef}
                cx={RING_R + 8}
                cy={RING_R + 8}
                r={RING_R}
                fill="none"
                stroke="#4080E0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C}
                style={{ filter: "drop-shadow(0 0 6px rgba(115,179,247,0.8))" }}
              />
            </svg>
            <ElevatorButton
              size={112}
              onClick={call}
              disabled={phase !== "ready"}
              aria-label="Llamar ascensor"
              className={phase === "ready" ? "animate-pulse-glow" : ""}
            >
              <ArrowUpIcon size={38} />
            </ElevatorButton>
          </div>
          <p className="text-sm tracking-[0.35em] text-steel/80">
            {phase === "ready" ? "LLAMAR ASCENSOR" : "PREPARANDO CABINA…"}
          </p>
        </div>
      )}

      <p className="absolute bottom-8 text-xs tracking-[0.3em] text-steel/40">
        SANTA FE · ARGENTINA
      </p>
    </div>
  );
}
