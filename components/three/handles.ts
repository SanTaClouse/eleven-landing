import type {
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
} from "three";

/**
 * Handles imperativos compartidos entre la escena (que crea los objetos) y
 * RigController (que los anima cada frame). Evita pasar por React en el
 * hot path de 60fps.
 */
export interface SceneHandles {
  /** Grupo de la cabina completa (se mueve en Y con el scroll) */
  cabin: Group | null;
  /** Hojas de puerta izquierda/derecha (deslizan en X) */
  doorL: Mesh | null;
  doorR: Mesh | null;
  /** Luz interior de la cabina (sube al abrir puertas) */
  interiorLight: PointLight | null;
  /** Material del plafón lumínico del techo de la cabina */
  ceilingMat: MeshStandardMaterial | null;
  /** Tiras de luz por piso en el frente del edificio: se encienden al pasar */
  floorStrips: { mat: MeshStandardMaterial; y: number }[];
}

export function createHandles(): SceneHandles {
  return {
    cabin: null,
    doorL: null,
    doorR: null,
    interiorLight: null,
    ceilingMat: null,
    floorStrips: [],
  };
}
