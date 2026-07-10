/**
 * ridePath.ts — LA función de sincronización scroll ↔ 3D.
 *
 * Todo el recorrido (aproximación al edificio, entrada al ascensor, subida
 * piso a piso con apertura de puertas y llegada final) es una función PURA
 * del progreso de scroll p ∈ [0,1]. RigController la evalúa cada frame con
 * el progreso suavizado y aplica el resultado a cámara, cabina, puertas y
 * luces. ScrollController usa `panelWindow()` para desvanecer los paneles
 * HTML exactamente en sincronía con las puertas 3D.
 *
 * Si tocás rangos acá, los overlays quedan sincronizados solos: no hay
 * ningún otro lugar con números mágicos de timing.
 */

import { clamp01, lerp, lerp3, smoothstep, type Vec3 } from "./math";

/* ── Geometría del mundo ────────────────────────────────────────────────── */
export const FLOOR_H = 3; //          altura entre pisos
export const FLOORS = 4; //           pisos de servicios (1..4)
export const TOP_Y = FLOOR_H * (FLOORS + 1); // piso final (contacto) = 15
export const EYE = 1.65; //           altura de ojo dentro de la cabina
export const CABIN_Z = 3.2; //        posición z de la cámara dentro de la cabina
export const DOOR_Z = 4.45; //        plano de puertas (cara exterior del edificio)

/* ── Fases del recorrido en progreso de scroll ──────────────────────────── */
const APPROACH_END = 0.14; //  dolly-in hacia el ascensor
const DOORS_OPEN_PB: [number, number] = [0.14, 0.19];
const ENTER: [number, number] = [0.2, 0.3]; //   la cámara cruza las puertas
const TURN: [number, number] = [0.22, 0.32]; //  giro de 180° (mirar hacia afuera)
const DOORS_CLOSE_PB: [number, number] = [0.28, 0.335];
const ASCENT_START = 0.34;
const ASCENT_END = 0.86;
const SEG = (ASCENT_END - ASCENT_START) / FLOORS; // 0.13 por piso

/* Sub-timing dentro de cada segmento de piso (t local 0..1).
   El tramo "puertas cerradas" entre piso y piso se acorta al mínimo:
   la cabina sube rápido (26% del segmento) y las puertas abren apenas
   llega, así el scroll nunca atraviesa un tramo muerto largo. */
const T_RISE_END = 0.26; //  0.00–0.26  la cabina sube al piso
const T_OPEN: [number, number] = [0.26, 0.36]; // puertas abren
const T_CLOSE: [number, number] = [0.86, 0.96]; // puertas cierran

/* Llegada final (piso 5 = contacto) */
const FINAL_RISE: [number, number] = [0.86, 0.925];
const FINAL_OPEN: [number, number] = [0.93, 0.97];
const FINAL_STEP_OUT: [number, number] = [0.94, 1.0];

export interface RideState {
  camPos: Vec3;
  camTarget: Vec3;
  cabinY: number;
  /** apertura de puertas 0..1 (cerradas..abiertas) */
  doorOpen: number;
  /** piso mostrado en displays: 0=PB, 1..4, 5=final */
  floor: number;
  /** opacidad del HUD (display superior) 0..1 */
  hudOpacity: number;
  /** intensidad extra de luz interior al abrir puertas */
  interiorBoost: number;
}

function ramp(p: number, [a, b]: [number, number]): number {
  return smoothstep(a, b, p);
}

/** Altura de la cabina para un progreso dado */
export function cabinYAt(p: number): number {
  if (p < ASCENT_START) return 0;
  if (p >= ASCENT_END) {
    // Subida final al piso de contacto
    return lerp(FLOORS * FLOOR_H, TOP_Y, ramp(p, FINAL_RISE));
  }
  const i = Math.min(FLOORS - 1, Math.floor((p - ASCENT_START) / SEG));
  const t = clamp01((p - ASCENT_START - i * SEG) / SEG);
  const from = i * FLOOR_H;
  const to = (i + 1) * FLOOR_H;
  return lerp(from, to, smoothstep(0, T_RISE_END, t));
}

/** Apertura de puertas para un progreso dado */
export function doorOpenAt(p: number): number {
  // PB: abren para dejar entrar, cierran detrás de la cámara
  if (p < ASCENT_START) {
    return ramp(p, DOORS_OPEN_PB) - ramp(p, DOORS_CLOSE_PB);
  }
  if (p >= ASCENT_END) return ramp(p, FINAL_OPEN); // llegada: quedan abiertas
  const i = Math.min(FLOORS - 1, Math.floor((p - ASCENT_START) / SEG));
  const t = clamp01((p - ASCENT_START - i * SEG) / SEG);
  return smoothstep(T_OPEN[0], T_OPEN[1], t) - smoothstep(T_CLOSE[0], T_CLOSE[1], t);
}

/**
 * Ventana de visibilidad del panel HTML del servicio `i` (0-based) en
 * progreso GLOBAL de scroll: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
 * Ligada al sub-timing de puertas para que el texto aparezca cuando las
 * puertas 3D terminan de abrir y se vaya antes de que cierren.
 */
export function panelWindow(i: number): [number, number, number, number] {
  const s = ASCENT_START + i * SEG;
  return [s + 0.28 * SEG, s + 0.4 * SEG, s + 0.8 * SEG, s + 0.92 * SEG];
}

/**
 * Progreso de REPOSO de cada piso de servicios (1..4) para el scroll por
 * pasos: t=0.6 del segmento es el centro de la meseta "puertas abiertas +
 * panel 100% visible" (abren hasta t=0.36, cierran desde t=0.86). El
 * ScrollController detiene el ascensor exactamente acá entre gesto y gesto.
 */
export const FLOOR_STOPS = Array.from(
  { length: FLOORS },
  (_, i) => ASCENT_START + (i + 0.6) * SEG,
);

/** Estado completo del recorrido para un progreso p ∈ [0,1] */
export function rideStateAt(p: number): RideState {
  p = clamp01(p);
  const cabinY = cabinYAt(p);
  const doorOpen = doorOpenAt(p);

  let camPos: Vec3;
  let camTarget: Vec3;

  if (p < ENTER[0]) {
    // A) Aproximación: dolly-in desde la vista del edificio hasta las puertas
    const k = smoothstep(0, APPROACH_END, p);
    camPos = lerp3([0, 3.1, 24], [0, EYE, 8.2], k);
    camTarget = [0, lerp(6.5, EYE, k), DOOR_Z];
  } else {
    // B) Entrada + giro: la cámara cruza el umbral y rota 180° para mirar
    //    hacia afuera (dirección +z), como al darse vuelta en un ascensor.
    const kIn = smoothstep(ENTER[0], ENTER[1], p);
    const z = lerp(8.2, CABIN_Z, kIn);
    const yaw = Math.PI * (1 - smoothstep(TURN[0], TURN[1], p)); // π → 0
    const y = cabinY + EYE;
    camPos = [0, y, z];
    camTarget = [Math.sin(yaw) * 12, y, z + Math.cos(yaw) * 12];

    // C) Llegada: pequeño paso hacia adelante al abrirse las puertas finales
    if (p > FINAL_STEP_OUT[0]) {
      const kOut = smoothstep(FINAL_STEP_OUT[0], FINAL_STEP_OUT[1], p);
      camPos = [0, y, lerp(CABIN_Z, 5.2, kOut)];
    }
  }

  // Piso para displays: redondeo de la altura de cabina
  const floor = Math.min(FLOORS + 1, Math.round(cabinY / FLOOR_H));

  // HUD visible solo dentro de la cabina
  const hudOpacity =
    smoothstep(ENTER[1], ASCENT_START, p) * (1 - smoothstep(0.96, 1.0, p));

  return {
    camPos,
    camTarget,
    cabinY,
    doorOpen,
    floor,
    hudOpacity,
    interiorBoost: doorOpen,
  };
}

/* ── Pose inicial del barrido de intro (fase "arriving") ────────────────── */
export const INTRO_POS: Vec3 = [17, 12, 28];
export const INTRO_TARGET: Vec3 = [0, 7, 0];
