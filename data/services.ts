/**
 * Servicios de ELEVEN ASCENSORES — un servicio por piso del recorrido.
 *
 * ✏️ EDITABLE: cambiá títulos, descripciones y detalles acá sin tocar la
 * lógica de la experiencia. El orden del array define el orden de aparición.
 * Copys y datos de contacto tomados del sitio anterior (fuente real).
 */

export interface Service {
  /** Etiqueta del piso en el display del ascensor (ej: "1") */
  floor: string;
  /** Nombre corto del servicio */
  title: string;
  /** Descripción */
  description: string;
  /** Bullets breves de apoyo */
  highlights: string[];
  /** Métrica de prueba social opcional (contador animado + cinta) */
  stat?: {
    value: number;
    suffix?: string;
    label: string;
    /** mostrar la cinta de edificios (data/buildings.ts) */
    showcase?: boolean;
  };
}

export const SERVICES: Service[] = [
  {
    floor: "1",
    title: "Mantenimiento de ascensores",
    description:
      "Planes de mantenimiento preventivo y correctivo para garantizar el funcionamiento óptimo de su ascensor. Inspecciones periódicas y reparaciones certificadas.",
    highlights: [
      "Inspecciones mensuales",
      "Mantenimiento preventivo",
      "Reparaciones de emergencia",
      "Certificaciones técnicas",
    ],
    stat: {
      value: 60,
      suffix: "+",
      label: "edificios a nuestro cargo en Santa Fe",
      showcase: true,
    },
  },
  {
    floor: "2",
    title: "Modernización",
    description:
      "Actualización y modernización de ascensores antiguos. Mejoramos eficiencia energética, seguridad y estética para alargar la vida útil del equipo.",
    highlights: [
      "Actualización tecnológica",
      "Mejora de seguridad",
      "Eficiencia energética",
      "Renovación estética",
    ],
  },
  {
    floor: "3",
    title: "Instalación de ascensores",
    description:
      "Instalación profesional de ascensores nuevos en edificios residenciales y comerciales. Asesoramiento técnico y cumplimiento de normativas vigentes.",
    highlights: [
      "Asesoramiento técnico",
      "Instalación certificada",
      "Cumplimiento normativo",
      "Garantía extendida",
    ],
  },
  {
    floor: "4",
    title: "Urgencias 24/7",
    description:
      "Atención inmediata ante cualquier falla o emergencia con su ascensor. Técnicos disponibles todos los días del año para rescates de personas, reparaciones urgentes y diagnóstico de fallas.",
    highlights: [
      "Guardia activa 24/7",
      "Rescate de personas",
      "Respuesta promedio: 30 min en Santa Fe capital",
    ],
  },
];

/** Datos de contacto reales de la empresa */
export const CONTACT = {
  name: "ELEVEN Ascensores",
  city: "Santa Fe Capital, Santa Fe, Argentina",
  /** Para mostrar */
  phone: "+54 9 342 626 4019",
  /** Para links tel: */
  phoneRaw: "+5493426264019",
  /** Para wa.me */
  whatsapp: "5493426264019",
  email: "elevenautomatismos@gmail.com",
};

/** Sellos de confianza (del sitio anterior) */
export const TRUST = [
  "Técnicos certificados",
  "Respuesta inmediata",
  "Disponibles 24/7",
];
