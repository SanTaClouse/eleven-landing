"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  detectTier,
  persistMode,
  resolveMode,
  type ExperienceMode,
  type QualityTier,
} from "@/lib/quality";
import { setState } from "@/lib/store";
import { StaticExperience } from "./StaticExperience";

/** Pantalla neutra mientras decide el modo / carga el chunk 3D */
function BootScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/eleven-logo.png"
        alt="Eleven Ascensores"
        className="h-14 w-auto animate-pulse"
      />
    </div>
  );
}

// Lazy-load del bundle 3D (three + drei) solo si se va a usar
const Experience = dynamic(
  () => import("./Experience").then((m) => m.Experience),
  { ssr: false, loading: () => <BootScreen /> },
);

/**
 * Gate de la experiencia: decide en cliente entre 3D inmersivo y versión
 * accesible según prefers-reduced-motion, WebGL, hardware y preferencia
 * guardada del usuario.
 */
export function Landing() {
  const [mode, setMode] = useState<ExperienceMode | null>(null);
  const [tier, setTier] = useState<QualityTier>("high");

  useEffect(() => {
    setMode(resolveMode());
    setTier(detectTier());
  }, []);

  const switchMode = (next: ExperienceMode) => {
    persistMode(next);
    window.scrollTo(0, 0);
    if (next === "3d") {
      // Reiniciar la experiencia desde el preloader
      setState({
        phase: "loading",
        sceneReady: false,
        targetProgress: 0,
        progress: 0,
        introT: 0,
        floor: 0,
        moving: false,
        stopIndex: 0,
        stepping: false,
        requestedStop: -1,
      });
    } else {
      document.body.style.overflow = "";
    }
    setMode(next);
  };

  if (!mode) return <BootScreen />;

  return mode === "3d" ? (
    <Experience tier={tier} onAccessible={() => switchMode("static")} />
  ) : (
    <StaticExperience onImmersive={() => switchMode("3d")} />
  );
}
