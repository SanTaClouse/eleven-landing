"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { setState, useExperience } from "@/lib/store";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // iOS Safari: al primer scroll colapsa la barra de dirección y cambia el
  // alto del viewport; sin esto ScrollTrigger se re-mide en ese momento y
  // produce un tirón. Ignoramos ese resize (solo re-medimos en rotación).
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  SINCRONIZACIÓN scroll ↔ progreso (punto delicado #1)
 * ══════════════════════════════════════════════════════════════════════════
 *  Lenis reemplaza el scroll nativo por uno inercial continuo (la rueda ya
 *  no avanza "a saltos"), y ScrollTrigger mapea el alto del spacer (≈700vh)
 *  a targetProgress ∈ [0,1]. NO se anima nada acá: el valor entra al store
 *  y RigController lo suaviza cada frame. Doble etapa (lenis + damping)
 *  = scroll fluido tipo manteca sin desacoplar 3D y overlays.
 *
 *  También orquesta las fases: bloquea el scroll hasta que el usuario tomó
 *  el ascensor y ejecuta el barrido de cámara de intro (tween de introT).
 * ══════════════════════════════════════════════════════════════════════════
 */
export function ScrollController({
  spacerRef,
}: {
  spacerRef: RefObject<HTMLDivElement>;
}) {
  const phase = useExperience((s) => s.phase);
  const lenisRef = useRef<Lenis | null>(null);

  // Lenis + ScrollTrigger sobre el ticker de GSAP (un solo reloj)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.stop(); // arranca frenado: se libera al subir al ascensor
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Mapeo scroll → targetProgress (una sola vez)
  useEffect(() => {
    if (!spacerRef.current) return;
    const st = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setState({ targetProgress: self.progress }),
    });
    return () => st.kill();
  }, [spacerRef]);

  // Orquestación de fases
  useEffect(() => {
    // Scroll bloqueado hasta estar arriba del ascensor
    document.body.style.overflow = phase === "ride" ? "" : "hidden";
    if (phase === "ride") {
      lenisRef.current?.start();
      // Re-medir DESPUÉS de desbloquear el scroll (con el layout final)
      requestAnimationFrame(() => ScrollTrigger.refresh());
    } else {
      lenisRef.current?.stop();
    }

    if (phase === "arriving") {
      window.scrollTo(0, 0);
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
  }, [phase]);

  return null;
}
