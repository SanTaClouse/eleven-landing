"use client";

import { getState } from "./store";

/**
 * "Ding" de ascensor sintetizado con WebAudio — sin assets externos.
 * Respeta el mute del store. Se crea el AudioContext recién en el primer
 * gesto del usuario (el click del botón de llamada) para cumplir las
 * políticas de autoplay.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function strike(ac: AudioContext, freq: number, gain: number, decay: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + decay);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + decay);
}

/** Campanilla de llegada (dos parciales, estilo "ding" clásico). */
export function playDing() {
  if (getState().muted) return;
  const ac = getCtx();
  if (!ac) return;
  strike(ac, 1318.51, 0.12, 1.4); // E6 — fundamental
  strike(ac, 1975.53, 0.05, 1.0); // B6 — brillo
  strike(ac, 659.25, 0.04, 1.6); //  E5 — cuerpo
}

/** Click corto de botón físico. */
export function playClick() {
  if (getState().muted) return;
  const ac = getCtx();
  if (!ac) return;
  strike(ac, 2200, 0.03, 0.08);
}

/** Beep sutil de display (cambio de piso en la cuenta regresiva). */
export function playTick() {
  if (getState().muted) return;
  const ac = getCtx();
  if (!ac) return;
  strike(ac, 1150, 0.035, 0.1);
}

/* ── Puertas: ruido filtrado con barrido de frecuencia (slide neumático) ── */

let noiseBuf: AudioBuffer | null = null;

function getNoise(ac: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/**
 * Deslizamiento de puertas. `open=true` barre grave→agudo (abrir);
 * `open=false` barre agudo→grave y remata con un "thunk" al asentar.
 */
export function playDoorSlide(open: boolean) {
  if (getState().muted) return;
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const dur = 0.55;

  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(open ? 260 : 1100, t0);
  bp.frequency.exponentialRampToValueAtTime(open ? 1100 : 260, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.07);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + dur);

  if (!open) {
    // "thunk" grave al terminar de cerrar
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 110;
    const g2 = ac.createGain();
    const t1 = t0 + dur - 0.1;
    g2.gain.setValueAtTime(0.055, t1);
    g2.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.2);
    osc.connect(g2).connect(ac.destination);
    osc.start(t1);
    osc.stop(t1 + 0.2);
  }
}
