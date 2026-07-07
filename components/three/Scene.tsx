"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, Preload, Sparkles } from "@react-three/drei";
import { INTRO_POS } from "@/lib/ridePath";
import type { QualityTier } from "@/lib/quality";
import { setState } from "@/lib/store";
import { Building } from "./Building";
import { Elevator } from "./Elevator";
import { createHandles } from "./handles";
import { RigController } from "./RigController";

/**
 * Canvas R3F fijo a pantalla completa detrás de los overlays HTML.
 * La iluminación de reflejo se genera proceduralmente con Lightformers
 * (sin HDRI externo): reflejos fríos azul-acero + una luz cálida lateral,
 * el contraste "acero + vidrio + luz" del branding Eleven.
 */
export function Scene({ tier }: { tier: QualityTier }) {
  const handles = useMemo(createHandles, []);
  const high = tier === "high";

  return (
    <Canvas
      dpr={high ? [1, 2] : [1, 1.5]}
      shadows={high}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.1, far: 220, position: INTRO_POS }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.45; // escena más luminosa sin lavar el HDR
        setState({ sceneReady: true });
      }}
      style={{ pointerEvents: "none" }}
    >
      <color attach="background" args={["#0E1526"]} />
      <fog attach="fog" args={["#0E1526", 30, 130]} />

      {/* Luz principal cálida-neutra + relleno hemisférico + rim azul */}
      <ambientLight intensity={0.4} color="#a9c2e8" />
      <hemisphereLight intensity={0.45} color="#9db9e8" groundColor="#141b2c" />
      <directionalLight
        position={[14, 20, 16]}
        intensity={1.7}
        color="#ffe9d2"
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={25}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-12, 9, -8]} intensity={0.55} color="#4080E0" />

      <Suspense fallback={null}>
        <Building handles={handles} tier={tier} />
        <Elevator handles={handles} />

        {/* Entorno procedural para reflejos metálicos (sin fetch de HDRI) */}
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={2.2}
            position={[0, 9, 12]}
            scale={[14, 7, 1]}
            color="#8fb8ff"
          />
          <Lightformer
            form="rect"
            intensity={1.4}
            position={[-10, 5, -4]}
            rotation-y={Math.PI / 2}
            scale={[10, 5, 1]}
            color="#4080E0"
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            position={[10, 7, 2]}
            rotation-y={-Math.PI / 2}
            scale={[10, 5, 1]}
            color="#ffedd8"
          />
          <Lightformer
            form="ring"
            intensity={1.1}
            position={[0, 18, 0]}
            rotation-x={Math.PI / 2}
            scale={12}
            color="#73B3F7"
          />
        </Environment>

        {/* Partículas de aire muy sutiles (solo desktop) */}
        {high && (
          <Sparkles
            count={70}
            position={[0, 9, 2]}
            scale={[36, 22, 30]}
            size={1.7}
            speed={0.32}
            opacity={0.3}
            color="#73B3F7"
          />
        )}

        {/* CLAVE PARA MOBILE: compila TODOS los shaders y sube todas las
            texturas al montar. Sin esto, iOS compila el material de cada
            objeto la primera vez que entra en cámara → tirones al empezar
            a scrollear (interior de cabina, torres de contexto, etc.). */}
        <Preload all />
      </Suspense>

      <RigController handles={handles} />
    </Canvas>
  );
}
