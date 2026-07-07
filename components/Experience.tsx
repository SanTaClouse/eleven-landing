"use client";

import { useRef } from "react";
import type { QualityTier } from "@/lib/quality";
import { ContactSection } from "./ContactSection";
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
      <div className="fixed inset-0 z-0">
        <Scene tier={tier} />
      </div>

      <RideOverlays />
      <ServicePanels />
      <Hud />
      <Header onAccessible={onAccessible} />
      <Preloader />
      <ScrollController spacerRef={spacerRef} />

      {/* Spacer de scroll: 100vh por "tramo" del recorrido aprox. */}
      <div ref={spacerRef} style={{ height: "700vh" }} aria-hidden />

      <ContactSection />
    </>
  );
}
