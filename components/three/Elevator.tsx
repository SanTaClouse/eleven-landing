"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/store";
import type { SceneHandles } from "./handles";
import { useCircleLogoTexture } from "./useLogoTexture";

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  PLACEHOLDER 3D — ASCENSOR
 * ══════════════════════════════════════════════════════════════════════════
 *  Cabina panorámica estilizada construida con primitivas y materiales
 *  metálicos (look cromado Eleven). Para reemplazar por un modelo real:
 *
 *    1. Poné tu archivo en /public/models/elevator.glb
 *    2. const { scene } = useGLTF("/models/elevator.glb")
 *       (+ useGLTF.preload("/models/elevator.glb") a nivel módulo)
 *    3. Renderizá <primitive object={scene} /> dentro del <group> de la
 *       cabina y mapeá los nodos de puertas a handles.doorL / handles.doorR
 *       (RigController las desliza en X: eso es lo único que espera).
 *
 *  El grupo raíz se mueve en Y (RigController); las puertas deslizan en X.
 * ══════════════════════════════════════════════════════════════════════════
 */

/** Acero pulido de marca */
const STEEL = { color: "#bcc9db", metalness: 1, roughness: 0.16, envMapIntensity: 1.4 };
/** Acero oscuro estructural */
const DARK_STEEL = { color: "#4a5872", metalness: 0.85, roughness: 0.3, envMapIntensity: 1.1 };

function floorLabel(floor: number): string {
  return floor <= 0 ? "PB" : String(Math.min(floor, 5));
}

/**
 * Textura de display moderna dibujada en canvas: mismo lenguaje visual que
 * el componente HTML <Display /> (Space Grotesk + glow azul sobre vidrio
 * oscuro). Se redibuja solo cuando cambia el piso.
 */
function useDisplayTexture(label: string): THREE.CanvasTexture {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 224;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const canvas = texture.image as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width: w, height: h } = canvas;
      // Vidrio oscuro con leve gradiente
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0c1424");
      bg.addColorStop(1, "#060a14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      // Dígito con glow de marca, centrado óptico exacto: se mide el alto
      // real del glifo y se apoya la línea de base donde corresponde.
      ctx.font = `600 130px "Space Grotesk", "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const metrics = ctx.measureText(label);
      const yBase =
        h / 2 +
        (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      ctx.shadowColor = "#73B3F7";
      ctx.shadowBlur = 42;
      ctx.fillStyle = "#a8ccff";
      ctx.fillText(label, w / 2, yBase);
      ctx.fillText(label, w / 2, yBase); // segunda pasada = glow más denso
      texture.needsUpdate = true;
    };
    draw();
    // Redibujar cuando la webfont termine de cargar (evita fallback feo)
    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(draw);
    }
    return () => {
      cancelled = true;
    };
  }, [label, texture]);

  return texture;
}

/** Tablero de piso moderno, reutilizado en exterior e interior de la cabina */
function DisplayPanel({
  label,
  position,
  rotationY = 0,
}: {
  label: string;
  position: [number, number, number];
  rotationY?: number;
}) {
  const texture = useDisplayTexture(label);
  return (
    <group position={position} rotation-y={rotationY}>
      {/* Marco de acero oscuro */}
      <mesh>
        <boxGeometry args={[0.82, 0.42, 0.04]} />
        <meshStandardMaterial color="#0a1120" metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Pantalla emisiva */}
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[0.74, 0.33]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Elevator({ handles }: { handles: SceneHandles }) {
  // El piso es discreto (cambia pocas veces): re-render React barato y en
  // sincronía exacta con el HUD HTML, porque ambos leen store.floor.
  const floor = useExperience((s) => s.floor);
  const label = floorLabel(floor);
  const circleLogoTex = useCircleLogoTexture();

  return (
    // Grupo raíz de la cabina — RigController escribe position.y cada frame
    <group ref={(g) => void (handles.cabin = g)}>
      {/* Piso de la cabina */}
      <mesh position={[0, 0.06, 3.3]}>
        <boxGeometry args={[2.7, 0.12, 2.5]} />
        <meshStandardMaterial color="#232d42" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Techo + plafón lumínico (el material se anima al abrir puertas) */}
      <mesh position={[0, 2.7, 3.3]}>
        <boxGeometry args={[2.7, 0.12, 2.5]} />
        <meshStandardMaterial {...DARK_STEEL} />
      </mesh>
      <mesh position={[0, 2.62, 3.3]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[2.1, 1.9]} />
        <meshStandardMaterial
          ref={(m) => void (handles.ceilingMat = m)}
          color="#dce8ff"
          emissive="#bcd7ff"
          emissiveIntensity={1.35}
          toneMapped={false}
        />
      </mesh>

      {/* Luz interior de la cabina */}
      <pointLight
        ref={(l) => void (handles.interiorLight = l)}
        position={[0, 2.3, 3.3]}
        color="#cfe2ff"
        intensity={1.15}
        distance={7}
        decay={1.8}
      />

      {/* Pared trasera de acero con tiras LED de marca */}
      <mesh position={[0, 1.35, 2.16]}>
        <boxGeometry args={[2.7, 2.7, 0.08]} />
        <meshStandardMaterial {...DARK_STEEL} />
      </mesh>
      {/* Placa circular de marca en la pared trasera: recibe al pasajero
          cuando las puertas se abren en PB y acompaña el giro al entrar
          (el wordmark ya está en header y fachada — acá va el iso circular).
          Con aire a los costados: las tiras LED están en x=±0.85. */}
      <mesh position={[0, 1.75, 2.21]}>
        <planeGeometry args={[1.15, 1.15]} />
        <meshBasicMaterial
          map={circleLogoTex}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 1.35, 2.22]}>
          <boxGeometry args={[0.04, 2.4, 0.02]} />
          <meshStandardMaterial
            color="#4080E0"
            emissive="#4080E0"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Paredes laterales de vidrio (insinuación de transparencia/reflejo:
          a través de ellas se ven pasar los rieles y luces de piso) */}
      {[-1.32, 1.32].map((x) => (
        <mesh key={x} position={[x, 1.35, 3.3]}>
          <boxGeometry args={[0.06, 2.7, 2.5]} />
          <meshStandardMaterial
            color="#73B3F7"
            metalness={0.9}
            roughness={0.05}
            transparent
            opacity={0.16}
            envMapIntensity={1.6}
          />
        </mesh>
      ))}

      {/* Pasamanos cromados */}
      <mesh position={[0, 1.02, 2.28]}>
        <boxGeometry args={[2.2, 0.06, 0.06]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      {[-1.24, 1.24].map((x) => (
        <mesh key={x} position={[x, 1.02, 3.3]}>
          <boxGeometry args={[0.06, 0.06, 1.9]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      ))}

      {/* Frente: pilares y dintel que enmarcan la puerta */}
      {[-1.03, 1.03].map((x) => (
        <mesh key={x} position={[x, 1.35, 4.42]}>
          <boxGeometry args={[0.64, 2.7, 0.1]} />
          <meshStandardMaterial {...DARK_STEEL} />
        </mesh>
      ))}
      <mesh position={[0, 2.55, 4.42]}>
        <boxGeometry args={[2.7, 0.4, 0.1]} />
        <meshStandardMaterial {...DARK_STEEL} />
      </mesh>

      {/* ── Puertas dobles de acero pulido ──────────────────────────────────
          RigController escribe position.x: ±(0.335 + 0.685·apertura).
          Sin marca en las hojas: el logo de la pared trasera es el que se
          revela al abrirse. */}
      <mesh ref={(m) => void (handles.doorL = m)} position={[-0.335, 1.21, 4.46]}>
        <boxGeometry args={[0.66, 2.3, 0.06]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh ref={(m) => void (handles.doorR = m)} position={[0.335, 1.21, 4.46]}>
        <boxGeometry args={[0.66, 2.3, 0.06]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>

      {/* Display de piso EXTERIOR (visible en la aproximación, muestra PB) */}
      <DisplayPanel label={label} position={[0, 2.55, 4.5]} />
      {/* Display de piso INTERIOR (visible durante el viaje, sobre las puertas) */}
      <DisplayPanel label={label} position={[0, 2.55, 4.34]} rotationY={Math.PI} />
    </group>
  );
}
