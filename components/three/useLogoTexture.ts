"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

export const LOGO_URL = "/brand/eleven-logo.png";
/** Relación ancho/alto del logo (1381×349) */
export const LOGO_ASPECT = 3.96;

/** Textura del logo Eleven lista para usar como decal emisivo en la escena */
export function useLogoTexture(): THREE.Texture {
  const tex = useTexture(LOGO_URL);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  }, [tex]);
  return tex;
}

