"use client";

import { useSyncExternalStore } from "react";

/**
 * Store mínimo (pub/sub mutable) que conecta los tres mundos de la
 * experiencia sin re-renders innecesarios:
 *
 *   ScrollTrigger (DOM)  →  targetProgress
 *   useFrame (R3F)       →  suaviza targetProgress → progress, cámara, cabina
 *   Overlays (React/DOM) →  se suscriben a floor / phase / progress
 *
 * Los valores por-frame (progress) los leen suscriptores manuales que
 * escriben estilos directo al DOM; React solo se suscribe a primitivas
 * discretas (phase, floor, muted) vía useSyncExternalStore.
 */

export type Phase =
  | "loading" //  precargando la escena 3D (botón deshabilitado)
  | "ready" //    escena lista, esperando el click de llamada
  | "calling" //  display contando 8 → PB
  | "arriving" // barrido de cámara de intro (GSAP)
  | "ride"; //    scroll habilitado: el usuario controla el ascensor

export interface ExperienceState {
  phase: Phase;
  /** Progreso de scroll crudo reportado por ScrollTrigger (0..1) */
  targetProgress: number;
  /** Progreso suavizado por frame (el que mueve cámara y overlays) */
  progress: number;
  /** 0..1 del barrido de cámara de intro (tween GSAP en fase "arriving") */
  introT: number;
  /** Piso actual: 0 = PB, 1..4 servicios, 5 = llegada/contacto */
  floor: number;
  /** true mientras la cabina está en movimiento vertical */
  moving: boolean;
  muted: boolean;
  /** el Canvas WebGL ya montó y renderizó su primer frame */
  sceneReady: boolean;
}

const state: ExperienceState = {
  phase: "loading",
  targetProgress: 0,
  progress: 0,
  introT: 0,
  floor: 0,
  moving: false,
  muted: false,
  sceneReady: false,
};

const listeners = new Set<() => void>();

export function getState(): ExperienceState {
  return state;
}

export function setState(partial: Partial<ExperienceState>) {
  let changed = false;
  for (const key of Object.keys(partial) as (keyof ExperienceState)[]) {
    if (state[key] !== partial[key]) {
      (state as unknown as Record<string, unknown>)[key] = partial[key];
      changed = true;
    }
  }
  if (changed) listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Hook React: seleccionar SIEMPRE primitivas (string/number/boolean) para
 * que useSyncExternalStore pueda cortar re-renders por igualdad.
 */
export function useExperience<T extends string | number | boolean>(
  selector: (s: ExperienceState) => T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}
