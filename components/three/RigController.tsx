"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { playDoorSlide } from "@/lib/audio";
import { damp, lerp3 } from "@/lib/math";
import {
  FLOOR_H,
  INTRO_POS,
  INTRO_TARGET,
  rideStateAt,
} from "@/lib/ridePath";
import { getState, setState } from "@/lib/store";
import type { SceneHandles } from "./handles";

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  SINCRONIZACIÓN scroll ↔ 3D (el punto más delicado de la experiencia)
 * ══════════════════════════════════════════════════════════════════════════
 *  Cada frame:
 *   1. Suaviza targetProgress (crudo de ScrollTrigger) → progress con
 *      amortiguación exponencial independiente del framerate. Esto da la
 *      sensación "flotante" de cabina real y evita el jitter de la rueda.
 *   2. Evalúa rideStateAt(progress): cámara, cabina, puertas, piso.
 *      En fase "arriving" interpola además la pose de intro (tween GSAP
 *      escribe store.introT).
 *   3. Aplica todo por referencia imperativa (sin pasar por React).
 *   4. Publica progress/floor/moving en el store → los overlays HTML
 *      (paneles de servicios, HUD) se actualizan con EL MISMO valor
 *      suavizado, por eso texto y puertas 3D nunca se desfasan.
 * ══════════════════════════════════════════════════════════════════════════
 */
export function RigController({ handles }: { handles: SceneHandles }) {
  const camera = useThree((s) => s.camera);
  const lastY = useRef(0);
  const lastDoor = useRef(0);
  const lastDoorSoundAt = useRef(0);

  useFrame((_, rawDt) => {
    const s = getState();
    const dt = Math.min(rawDt, 0.05); // clamp: evita saltos al recuperar foco

    // 1) Suavizado del progreso de scroll
    // El viaje entre paradas ya es un tween con easing; el damping acá queda
    // "atado" solo para redondear la llegada sin sensación de lag.
    const p = damp(s.progress, s.targetProgress, 7, dt);

    // 2) Estado del recorrido
    let ride = rideStateAt(p);
    let pos = ride.camPos;
    let target = ride.camTarget;

    if (s.phase !== "ride") {
      // Intro: barrido desde la vista aérea hasta la pose inicial del ride.
      // GSAP anima store.introT de 0→1 con easing, acá solo interpolamos.
      ride = rideStateAt(0);
      pos = lerp3(INTRO_POS, ride.camPos, s.introT);
      target = lerp3(INTRO_TARGET, ride.camTarget, s.introT);
    }

    // 3) Aplicación imperativa
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(target[0], target[1], target[2]);

    if (handles.cabin) handles.cabin.position.y = ride.cabinY;

    // Cerradas: ranura central de ~1cm (deja pasar un hilo de luz interior)
    const slide = 0.335 + 0.685 * ride.doorOpen;
    if (handles.doorL) handles.doorL.position.x = -slide;
    if (handles.doorR) handles.doorR.position.x = slide;

    // Sonido de puertas: se dispara al cruzar el umbral de apertura/cierre,
    // con cooldown para que el scrub reversible no lo spamee.
    const now = performance.now();
    const door = ride.doorOpen;
    const prev = lastDoor.current;
    if (s.phase === "ride" && now - lastDoorSoundAt.current > 600) {
      if (prev <= 0.06 && door > 0.06 && door > prev) {
        playDoorSlide(true);
        lastDoorSoundAt.current = now;
      } else if (prev >= 0.94 && door < 0.94 && door < prev) {
        playDoorSlide(false);
        lastDoorSoundAt.current = now;
      }
    }
    lastDoor.current = door;

    if (handles.interiorLight)
      handles.interiorLight.intensity = 1.15 + ride.interiorBoost * 1.8;
    if (handles.ceilingMat)
      handles.ceilingMat.emissiveIntensity = 1.35 + ride.interiorBoost * 0.85;

    // Tiras de piso: se encienden con la cercanía de la cabina
    for (const strip of handles.floorStrips) {
      if (!strip) continue;
      const d = Math.abs(strip.y - ride.cabinY);
      strip.mat.emissiveIntensity =
        0.5 + 2.4 * Math.max(0, 1 - d / FLOOR_H);
    }

    // 4) Publicación al store (React + overlays DOM)
    const moving = Math.abs(ride.cabinY - lastY.current) > 0.0015;
    lastY.current = ride.cabinY;
    setState({ progress: p, floor: ride.floor, moving });
  });

  return null;
}
