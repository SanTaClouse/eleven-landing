"use client";

import { useRef } from "react";
import type { QualityTier } from "@/lib/quality";
import { ContactSection } from "./ContactSection";
import { FloorTimeline } from "./FloorTimeline";
import { Header } from "./Header";
import { Hud } from "./Hud";
import { Preloader } from "./Preloader";
import { RideOverlays } from "./RideOverlays";
import { ScrollController } from "./ScrollController";
import { ServicePanels } from "./ServicePanels";
import { Scene } from "./three/Scene";

/**
 * Composición de la experiencia 3D scroll-driven:
 *
 *  z-0   Canvas R3F fijo (edificio + ascensor)
 *  z-10  Overlays sincronizados por scroll (titular, hint, paneles)
 *  z-20  HUD del display de piso
 *  z-30  Header
 *  z-50  Preloader (hasta llamar el ascensor)
 *
 *  El spacer transparente de 700vh es quien "mide" el scroll: ScrollTrigger
 *  lo mapea a progress y RigController mueve cámara/cabina. Al final, la
 *  sección de contacto (DOM opaco, z-10) cubre el canvas: el ascensor
 *  "llegó" a recepción.
 */
export function Experience({
  tier,
  onAccessible,
}: {
  tier: QualityTier;
  onAccessible: () => void;
}) {
  const spacerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Alto en lvh (viewport grande): en iOS NO cambia cuando la barra de
          dirección colapsa → el canvas WebGL nunca se redimensiona a mitad
          del scroll (realocar el framebuffer ahí produce un tirón). */}
      <div className="fixed inset-x-0 top-0 z-0 h-screen supports-[height:1lvh]:h-[100lvh]">
        <Scene tier={tier} />
      </div>

      <RideOverlays />
      <ServicePanels />
      <Hud />
      <Header onAccessible={onAccessible} />
      <Preloader />
      <FloorTimeline />
      <ScrollController spacerRef={spacerRef} />

      {/* Spacer de scroll: 100vh por "tramo" del recorrido aprox.
          svh (viewport chico) donde exista: en iOS no cambia cuando la barra
          de dirección colapsa, así el mapeo scroll→progreso queda estable. */}
      <div
        ref={spacerRef}
        className="h-[700vh] supports-[height:1svh]:h-[700svh]"
        aria-hidden
      />

      <ContactSection />
    </>
  );
}
