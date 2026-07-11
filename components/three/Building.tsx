"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { FLOOR_H, FLOORS, TOP_Y } from "@/lib/ridePath";
import type { QualityTier } from "@/lib/quality";
import type { SceneHandles } from "./handles";
import { LOGO_ASPECT, useCircleLogoTexture, useLogoTexture } from "./useLogoTexture";

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  PLACEHOLDER 3D — EDIFICIO
 * ══════════════════════════════════════════════════════════════════════════
 *  Torre de vidrio y acero estilizada + entorno urbano lejano. Para
 *  reemplazar por un modelo real, cargá un GLB con useGLTF (ver nota en
 *  Elevator.tsx) y mantené libre el canal frontal x ∈ [-1.7, 1.7] desde
 *  y=0 hasta y=17 (por ahí viaja la cabina).
 * ══════════════════════════════════════════════════════════════════════════
 */

const CHROME = { color: "#aebfd8", metalness: 1, roughness: 0.14, envMapIntensity: 1.5 };
const TRIM = { color: "#33425e", metalness: 0.8, roughness: 0.3, envMapIntensity: 1.1 };

/** Ventanas del edificio: una sola InstancedMesh (1 draw call),
 *  alineadas por piso para leerse como muro cortina real. */
function Windows() {
  const ref = useRef<THREE.InstancedMesh>(null);

  const { geometry, material, transforms } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(0.6, 0.46);
    const material = new THREE.MeshBasicMaterial({ toneMapped: false });
    const transforms: { pos: [number, number, number]; rotY: number; color: THREE.Color }[] = [];

    const rand = mulberry32(11); // seed fija: mismas luces en cada visita
    const windowColor = () => {
      const r = rand();
      if (r < 0.2) return new THREE.Color("#ffd9a0").multiplyScalar(0.95); // cálida
      if (r < 0.36) return new THREE.Color("#8fc0ff").multiplyScalar(0.7); // fría
      return new THREE.Color("#1b2a44"); // apagada (vidrio azulado)
    };

    // Tres filas de ventanas por piso, alineadas entre losas. La banda
    // superior (y > 17.4) queda libre: ahí vive el cartel de marca.
    const rowOffsets = [0.75, 1.5, 2.25];
    const rowYs: number[] = [];
    for (let f = 0; f < 7; f++) {
      for (const o of rowOffsets) {
        const y = f * FLOOR_H + o;
        if (y < 17.4) rowYs.push(y);
      }
    }

    // Cara frontal (z = 2.03), dejando libre el canal del ascensor
    for (let x = -5.2; x <= 5.21; x += 0.87) {
      if (Math.abs(x) < 2.45) continue;
      for (const y of rowYs) {
        transforms.push({ pos: [x, y, 2.03], rotY: 0, color: windowColor() });
      }
    }
    // Caras laterales (x = ±6.03)
    for (const sx of [-6.03, 6.03]) {
      for (let z = -5.4; z <= 1.41; z += 0.87) {
        for (const y of rowYs) {
          transforms.push({
            pos: [sx, y, z],
            rotY: sx > 0 ? Math.PI / 2 : -Math.PI / 2,
            color: windowColor(),
          });
        }
      }
    }
    return { geometry, material, transforms };
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    transforms.forEach((t, i) => {
      dummy.position.set(...t.pos);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, t.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [transforms]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, transforms.length]}
      frustumCulled={false}
    />
  );
}

/** PRNG determinista para que las ventanas no "salten" entre renders */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Building({
  handles,
  tier,
}: {
  handles: SceneHandles;
  tier: QualityTier;
}) {
  const logoTex = useLogoTexture();
  const circleLogoTex = useCircleLogoTexture();
  // Alturas con tira de luz: PB + pisos de servicio + llegada
  const stripYs = useMemo(
    () => Array.from({ length: FLOORS + 2 }, (_, i) => i * FLOOR_H),
    [],
  );

  return (
    <group>
      {/* Torre principal (vidrio azulado reflectivo) */}
      <mesh position={[0, 10, -2]} castShadow receiveShadow>
        <boxGeometry args={[12, 20, 8]} />
        <meshStandardMaterial
          color="#16233a"
          metalness={0.7}
          roughness={0.32}
          envMapIntensity={1.1}
        />
      </mesh>
      <Windows />

      {/* Losas horizontales por piso (ritmo arquitectónico del muro cortina) */}
      {[3, 6, 9, 12, 15, 18].map((y) => (
        <mesh key={y} position={[0, y, -2]}>
          <boxGeometry args={[12.08, 0.16, 8.02]} />
          <meshStandardMaterial {...TRIM} />
        </mesh>
      ))}
      {/* Esquineros verticales */}
      {[-6.02, 6.02].flatMap((x) =>
        [2.02, -6.02].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 10, z]}>
            <boxGeometry args={[0.2, 20, 0.2]} />
            <meshStandardMaterial {...TRIM} />
          </mesh>
        )),
      )}
      {/* Remate de techo + línea lumínica superior */}
      <mesh position={[0, 20.15, -2]}>
        <boxGeometry args={[12.7, 0.3, 8.7]} />
        <meshStandardMaterial {...TRIM} />
      </mesh>
      <mesh position={[0, 20.34, 2.28]}>
        <boxGeometry args={[12.7, 0.07, 0.07]} />
        <meshStandardMaterial
          color="#73B3F7"
          emissive="#73B3F7"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>

      {/* ── CARTEL DE MARCA en la banda superior de la fachada ────────────
          Placa de acero oscuro + logo luminoso (toneMapped=false = glow de
          letrero real). Protagonista en la intro y la aproximación. */}
      <group position={[0, 18.4, 2.06]}>
        <mesh>
          <boxGeometry args={[8.2, 2.15, 0.1]} />
          <meshStandardMaterial color="#0b1322" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[7.2, 7.2 / LOGO_ASPECT]} />
          <meshBasicMaterial map={logoTex} transparent toneMapped={false} depthWrite={false} />
        </mesh>
        {/* subrayado lumínico del letrero */}
        <mesh position={[0, -1.02, 0.07]}>
          <boxGeometry args={[7.6, 0.05, 0.03]} />
          <meshStandardMaterial
            color="#73B3F7"
            emissive="#73B3F7"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Zócalo / lobby en PB con luz de vidriera */}
      <mesh position={[0, 1.7, -2.03]}>
        <boxGeometry args={[12.4, 3.4, 8.06]} />
        <meshStandardMaterial color="#1d2b46" metalness={0.75} roughness={0.25} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, 3.44, 2.06]}>
        <boxGeometry args={[12.4, 0.09, 0.06]} />
        <meshStandardMaterial
          color="#73B3F7"
          emissive="#73B3F7"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* ── Torre del ascensor panorámico (frente del edificio) ──────────── */}
      {/* Columnas cromadas del riel */}
      {[-1.65, 1.65].flatMap((x) =>
        [2.5, 4.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, TOP_Y / 2 + 0.9, z]} castShadow>
            <boxGeometry args={[0.2, TOP_Y + 2.6, 0.2]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
        )),
      )}
      {/* Coronamiento del riel */}
      <mesh position={[0, TOP_Y + 2.2, 3.4]}>
        <boxGeometry args={[3.9, 0.28, 2.3]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      {/* Marcas de guía en los rieles: referencias que "pasan" al subir */}
      {[-1.52, 1.52].flatMap((x) =>
        Array.from({ length: 12 }, (_, i) => (
          <mesh key={`${x}-tick-${i}`} position={[x, 0.75 + i * 1.5, 3.4]}>
            <boxGeometry args={[0.05, 0.16, 0.05]} />
            <meshStandardMaterial
              color="#4080E0"
              emissive="#4080E0"
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        )),
      )}

      {/* Tiras de luz por piso: RigController les sube la intensidad cuando
          la cabina pasa (el "cambio de luz por piso") */}
      {stripYs.flatMap((y, i) =>
        [-2.05, 2.05].map((x, j) => (
          <mesh key={`strip-${i}-${j}`} position={[x, y + 1.2, 2.08]}>
            <boxGeometry args={[0.55, 0.09, 0.05]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) handles.floorStrips[i * 2 + j] = { mat: m, y: y };
              }}
              color="#4080E0"
              emissive="#4080E0"
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
        )),
      )}

      {/* Portal de acceso en PB */}
      {[-1.95, 1.95].map((x) => (
        <mesh key={x} position={[x, 1.6, 4.4]} castShadow>
          <boxGeometry args={[0.4, 3.2, 0.45]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      ))}
      <mesh position={[0, 3.3, 4.4]} castShadow>
        <boxGeometry args={[4.3, 0.4, 0.45]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* Luz de cortesía bajo el dintel */}
      <mesh position={[0, 3.08, 4.5]}>
        <boxGeometry args={[3.4, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#73B3F7"
          emissive="#73B3F7"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      {/* ── Emblema circular de marca sobre el dintel del portal ───────────
          Medallón (disco de acero + aro cromado + iso circular) apoyado en la
          banda del dintel y asomando un poco por encima. TOPE ≈ y 3.84: con
          FOV 50 el borde inferior del cuadro en la parada de piso 1
          (Mantenimiento, la más baja) cae en y≈3.98, así que hasta ~3.85 el
          emblema queda fuera de cuadro. No subir más el centro/radio o se
          asoma en esa parada. */}
      <group position={[0, 3.47, 4.63]}>
        {/* Disco de acero oscuro (fondo del medallón) */}
        <mesh position={[0, 0, -0.004]}>
          <circleGeometry args={[0.35, 48]} />
          <meshStandardMaterial color="#0b1322" metalness={0.75} roughness={0.3} />
        </mesh>
        {/* Aro cromado del medallón */}
        <mesh position={[0, 0, -0.002]}>
          <ringGeometry args={[0.35, 0.37, 48]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        {/* Iso circular sobre el disco */}
        <mesh position={[0, 0, 0.004]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshBasicMaterial map={circleLogoTex} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
      {/* Botonera de llamada sobre la cara frontal del pilar derecho del
          portal (gemela del botón HTML), de frente a la cámara al acercarse */}
      <group position={[1.95, 1.15, 4.630]}>
        {/* placa de acero */}
        <mesh>
          <boxGeometry args={[0.28, 0.54, 0.03]} />
          <meshStandardMaterial color="#2c3850" metalness={0.9} roughness={0.25} envMapIntensity={1.2} />
        </mesh>
        {/* aro cromado del botón */}
        <mesh rotation-x={Math.PI / 2} position={[0, 0.06, 0.03]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 24]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        {/* centro luminoso azul Eleven */}
        <mesh rotation-x={Math.PI / 2} position={[0, 0.06, 0.05]}>
          <cylinderGeometry args={[0.062, 0.062, 0.025, 24]} />
          <meshStandardMaterial
            color="#4080E0"
            emissive="#4080E0"
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
        {/* flecha ▲ sobre el centro (prisma triangular plano, vértice arriba) */}
        <mesh rotation-x={Math.PI / 2} position={[0, 0.06, 0.066]}>
          <cylinderGeometry args={[0.03, 0.03, 0.014, 3, 1, false, -Math.PI / 2]} />
          <meshStandardMaterial color="#F2F5FA" emissive="#F2F5FA" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        {/* LED de estado bajo el botón */}
        <mesh position={[0, -0.16, 0.02]}>
          <boxGeometry args={[0.12, 0.02, 0.01]} />
          <meshStandardMaterial
            color="#73B3F7"
            emissive="#73B3F7"
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ── Contexto urbano lejano (se funde con la niebla) ──────────────── */}
      {[
        { p: [-16, 6.5, -14] as const, s: [8, 13, 8] as const },
        { p: [15, 5, -16] as const, s: [7, 10, 7] as const },
        { p: [-9, 8, -24] as const, s: [6, 16, 6] as const },
        { p: [11, 9, -26] as const, s: [9, 18, 9] as const },
        { p: [22, 4, -8] as const, s: [6, 8, 6] as const },
        { p: [-23, 3.5, -6] as const, s: [6, 7, 6] as const },
      ].map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1], b.p[2]]}>
          <boxGeometry args={[b.s[0], b.s[1], b.s[2]]} />
          <meshStandardMaterial color="#131c30" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}

      {/* ── Piso urbano reflectivo (clave del look acero) ─────────────────── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 10]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        {tier === "high" ? (
          <MeshReflectorMaterial
            blur={[280, 80]}
            resolution={512}
            mixBlur={0.9}
            mixStrength={30}
            roughness={0.8}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#111c33"
            metalness={0.55}
            mirror={0.6}
          />
        ) : (
          <meshStandardMaterial color="#111c33" metalness={0.6} roughness={0.35} />
        )}
      </mesh>
    </group>
  );
}
