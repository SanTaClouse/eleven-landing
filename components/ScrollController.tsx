"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLOOR_STOPS } from "@/lib/ridePath";
import { getState, setState, subscribe, useExperience } from "@/lib/store";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // iOS Safari: al primer scroll colapsa la barra de dirección y cambia el
  // alto del viewport; sin esto ScrollTrigger se re-mide en ese momento y
  // produce un tirón. Ignoramos ese resize (solo re-medimos en rotación).
  ScrollTrigger.config({ ignoreMobileResize: true });
  // Sin lag smoothing: ante un pico de jank (compilación de shaders) el
  // viaje entre pisos sigue el reloj real en vez de "congelarse"; el damping
  // de RigController ya redondea cualquier salto de progreso.
  gsap.ticker.lagSmoothing(0);
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  SCROLL POR PASOS — tipo reels (punto delicado #1)
 * ══════════════════════════════════════════════════════════════════════════
 *  Durante el ride NO hay scroll libre: cada gesto (rueda, swipe o teclado),
 *  sin importar su fuerza, dispara UN viaje a la parada siguiente/anterior.
 *  El viaje es un tween de la posición de scroll → ScrollTrigger lo mapea a
 *  targetProgress → rideStateAt() reproduce la secuencia completa (cerrar
 *  puertas, subir, abrir puertas) exactamente como con el scrub manual.
 *
 *  Paradas (en progreso de ride): 0 = vista del edificio, FLOOR_STOPS[0..3]
 *  = pisos 1..4 con puertas abiertas y panel visible, y una última en px
 *  (tope del contacto) que reproduce la llegada completa + la sección
 *  cubriendo el canvas en un solo paso.
 *
 *  Anti-inercia: mientras un viaje anima se ignora todo input; al terminar,
 *  la cola de momentum de la rueda/trackpad se "traga" hasta detectar una
 *  pausa (MOMENTUM_GAP_MS sin eventos) — un flick fuerte avanza UN piso.
 *  El touch no tiene momentum porque preventDefault anula el scroll nativo.
 *
 *  Red de seguridad: si el scroll se mueve por fuera del stepper (arrastre
 *  de la scrollbar), un settle corrige a la parada más cercana.
 * ══════════════════════════════════════════════════════════════════════════
 */

/** Delta de rueda mínimo para considerarlo un gesto intencional */
const WHEEL_MIN = 8;
/** Arrastre táctil mínimo (px) para disparar un paso */
const SWIPE_MIN = 26;
/** ms sin eventos de rueda = terminó la inercia del gesto anterior.
    Generoso a propósito: bajo jank el stream de momentum puede traer pausas
    largas y no debe contar como un gesto nuevo (un flick = un piso). */
const MOMENTUM_GAP_MS = 400;
/** Espera tras un scroll externo (scrollbar) antes de corregir a una parada */
const SETTLE_MS = 250;
/** Duración del viaje: proporcional a la distancia en progreso, acotada.
    Piso a piso ≈ 3.1s (0.13 × 24): da tiempo a apreciar cerrar puertas,
    subida y apertura. Entrada y saltos largos topean en 5s. */
const DUR_PER_PROGRESS = 24;
const DUR_MIN = 1.6;
const DUR_MAX = 5;

export function ScrollController({
  spacerRef,
}: {
  spacerRef: RefObject<HTMLDivElement>;
}) {
  const phase = useExperience((s) => s.phase);

  /** Posiciones de scroll (px) de cada parada; se recalculan en cada refresh */
  const stopsRef = useRef<number[]>([0]);
  /** px de scroll que cubren el ride completo (progreso 0→1) */
  const rideSpanRef = useRef(1);
  const indexRef = useRef(0);
  const steppingRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const swallowRef = useRef(false);
  const swallowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const touchDone = useRef(false);

  const measure = () => {
    const spacer = spacerRef.current;
    if (!spacer) return;
    const vh = window.innerHeight;
    const rideSpan = Math.max(1, spacer.offsetHeight - vh);
    const maxScroll = document.documentElement.scrollHeight - vh;
    rideSpanRef.current = rideSpan;
    stopsRef.current = [
      0,
      ...FLOOR_STOPS.map((p) => p * rideSpan),
      // Última parada: la sección de contacto cubriendo el viewport (o el
      // fondo del documento si el contacto es más bajo que la pantalla).
      Math.min(spacer.offsetHeight, maxScroll),
    ];
  };

  /** Traga la cola de momentum de rueda/trackpad hasta que haya una pausa */
  const startSwallow = () => {
    swallowRef.current = true;
    if (swallowTimer.current) clearTimeout(swallowTimer.current);
    swallowTimer.current = setTimeout(() => {
      swallowRef.current = false;
    }, MOMENTUM_GAP_MS);
  };

  const goToStop = (i: number, settle = false) => {
    const stops = stopsRef.current;
    const to = stops[i];
    const from = window.scrollY;
    indexRef.current = i;
    if (Math.abs(to - from) < 1) {
      setState({ stopIndex: i });
      return;
    }
    const dist = Math.abs(to - from) / rideSpanRef.current;
    const duration = settle
      ? 0.8
      : Math.min(DUR_MAX, Math.max(DUR_MIN, dist * DUR_PER_PROGRESS));
    steppingRef.current = true;
    setState({ stopIndex: i, stepping: true });
    tweenRef.current?.kill();
    const proxy = { y: from };
    tweenRef.current = gsap.to(proxy, {
      y: to,
      duration,
      ease: settle ? "power2.out" : "power2.inOut",
      onUpdate: () => window.scrollTo(0, proxy.y),
      onComplete: () => {
        steppingRef.current = false;
        setState({ stepping: false });
        startSwallow();
      },
    });
  };

  const step = (dir: 1 | -1) => {
    if (steppingRef.current) return; // un gesto a la vez (rueda Y teclado)
    const last = stopsRef.current.length - 1;
    const next = Math.min(last, Math.max(0, indexRef.current + dir));
    if (next !== indexRef.current) goToStop(next);
  };

  /**
   * El contacto puede ser más alto que el viewport: dentro de esa "cola"
   * (entre el tope del contacto y el fondo del documento) el scroll vuelve
   * a ser nativo. true = dejar pasar el gesto sin interceptarlo.
   */
  const inContactTail = (down: boolean) => {
    const stops = stopsRef.current;
    const last = stops.length - 1;
    if (indexRef.current !== last || steppingRef.current) return false;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    return down
      ? window.scrollY < maxScroll - 1
      : window.scrollY > stops[last] + 1;
  };

  /** Corrige a la parada más cercana si el scroll se movió fuera del stepper */
  const scheduleSettle = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (getState().phase !== "ride" || steppingRef.current) return;
      const stops = stopsRef.current;
      const y = window.scrollY;
      let nearest = 0;
      for (let i = 1; i < stops.length; i++) {
        if (Math.abs(stops[i] - y) < Math.abs(stops[nearest] - y)) nearest = i;
      }
      if (Math.abs(stops[nearest] - y) > 2) goToStop(nearest, true);
      else if (indexRef.current !== nearest) {
        indexRef.current = nearest;
        setState({ stopIndex: nearest });
      }
    }, SETTLE_MS);
  };

  // Mapeo scroll → targetProgress + medición de paradas (una sola vez)
  useEffect(() => {
    if (!spacerRef.current) return;
    measure();
    const st = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setState({ targetProgress: self.progress });
        scheduleSettle();
      },
    });
    // Rotación / resize: re-medir paradas y re-anclar a la parada actual
    // para no quedar nunca entre pisos.
    const onRefresh = () => {
      measure();
      if (getState().phase === "ride" && !steppingRef.current) {
        window.scrollTo(0, stopsRef.current[indexRef.current]);
      }
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      st.kill();
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacerRef]);

  // Saltos pedidos desde la UI (puntos del timeline)
  useEffect(
    () =>
      subscribe(() => {
        const s = getState();
        if (s.requestedStop < 0) return;
        const i = s.requestedStop;
        setState({ requestedStop: -1 });
        if (s.phase !== "ride") return;
        goToStop(Math.min(stopsRef.current.length - 1, Math.max(0, i)));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Orquestación de fases + captura de gestos durante el ride
  useEffect(() => {
    // Scroll bloqueado hasta estar arriba del ascensor
    document.body.style.overflow = phase === "ride" ? "" : "hidden";

    if (phase === "arriving") {
      window.scrollTo(0, 0);
      indexRef.current = 0;
      setState({ stopIndex: 0, stepping: false });
      // Barrido de cámara: la intro anima introT y RigController interpola
      // entre la pose aérea y la pose inicial del recorrido.
      const obj = { t: 0 };
      const tween = gsap.to(obj, {
        t: 1,
        duration: 2.6,
        ease: "power2.inOut",
        onUpdate: () => setState({ introT: obj.t }),
        onComplete: () => setState({ phase: "ride" }),
      });
      return () => {
        tween.kill();
      };
    }

    if (phase !== "ride") return;

    // Re-medir DESPUÉS de desbloquear el scroll (con el layout final)
    requestAnimationFrame(() => ScrollTrigger.refresh());
    // Sin rebote/pull-to-refresh en los topes (mobile)
    document.documentElement.style.overscrollBehaviorY = "none";

    const onWheel = (e: WheelEvent) => {
      const down = e.deltaY > 0;
      if (inContactTail(down)) return; // scroll nativo dentro del contacto
      e.preventDefault();
      if (steppingRef.current) return;
      if (swallowRef.current) {
        startSwallow(); // sigue llegando inercia: extender la ventana
        return;
      }
      if (Math.abs(e.deltaY) < WHEEL_MIN) return;
      step(down ? 1 : -1);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchDone.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // pinch: no interferir
      const dy = touchStartY.current - e.touches[0].clientY; // >0 = avanzar
      if (inContactTail(dy > 0)) return;
      if (e.cancelable) e.preventDefault();
      if (steppingRef.current || touchDone.current) return;
      if (Math.abs(dy) < SWIPE_MIN) return;
      touchDone.current = true; // un swipe = un paso, hasta soltar el dedo
      step(dy > 0 ? 1 : -1);
    };

    const onTouchEnd = () => {
      touchDone.current = false;
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      )
        return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey))
        step(1);
      else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey))
        step(-1);
      else if (e.key === "Home") goToStop(0);
      else if (e.key === "End") goToStop(stopsRef.current.length - 1);
      else return;
      e.preventDefault();
    };

    // La inercia nativa de la cola del contacto no puede volver a asomar el 3D
    const onScroll = () => {
      if (steppingRef.current) return;
      const stops = stopsRef.current;
      const last = stops.length - 1;
      if (indexRef.current === last && window.scrollY < stops[last] - 1) {
        window.scrollTo(0, stops[last]);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.overscrollBehaviorY = "";
      tweenRef.current?.kill();
      if (swallowTimer.current) clearTimeout(swallowTimer.current);
      steppingRef.current = false;
      swallowRef.current = false;
      setState({ stepping: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return null;
}
