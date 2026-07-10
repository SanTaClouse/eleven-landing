"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

export const LOGO_URL = "/brand/eleven-logo.png";
/** Relación ancho/alto del logo (1381×349) */
export const LOGO_ASPECT = 3.96;

/** Logo circular (disco con aro y flechas, 512×512, alfa fuera del aro) */
export const CIRCLE_LOGO_URL = "/brand/eleven-circular.png";

/** Textura del logo Eleven lista para usar como decal emisivo en la escena */
export function useLogoTexture(): THREE.Texture {
  const tex = useTexture(LOGO_URL);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  }, [tex]);
  return tex;
}

/** Textura del logo circular (placa interior de la cabina) */
export function useCircleLogoTexture(): THREE.Texture {
  const tex = useTexture(CIRCLE_LOGO_URL);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  }, [tex]);
  return tex;
}

