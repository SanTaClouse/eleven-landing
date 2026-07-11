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
      "Planes de mantenimiento preventivo adecuados para tu ascensor. Trabajamos con amplia variedad de marcas y diversas tecnologías.",
    highlights: [
      "Inspecciones mensuales",
      "Reparaciones de emergencia",
      "Atención inmediata",
      "Alarga la vida útil de tu ascensor",
      "Conserva adecuadamente cada componente",
      "Garantiza condiciones seguras de funcionamiento",
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
      "Modernizaciones parciales y totales para Ascensores antiguos o fuera de vigencia. Mejoramos la eficiencia energética, la seguridad y prolongamos la vida útil del equipo.",
    highlights: [
      "Modernizaciones eléctricas totales",
      "Renovación de cabinas",
      "Renovación de sistema motriz",
      "Modernizaciones parciales",
      "Ahorro de energía eléctrica",
      "Renovación estética",
    ],
  },
  {
    floor: "3",
    title: "Instalación de ascensores",
    description:
      "Instalación de ascensores nuevos en edificios, residencias o comercios. Asesoramiento técnico, relevamientos y montajes desde cero.",
    highlights: [
      "Asesoramiento técnico",
      "Cumplimiento de normativa",
      "Trabajos garantizados",
      "Atención post venta",
    ],
  },
  {
    floor: "4",
    title: "Urgencias 24/7",
    description:
      "Atención inmediata ante emergencias. Técnicos disponibles todos los días del año para realizar rescates de personas, reparaciones urgentes y diagnósticos de fallas.",
    highlights: [
      "Guardia activa 24/7",
      "Respuesta inmediata",
      "Compromiso y responsabilidad",
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
