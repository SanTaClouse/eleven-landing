import type { Config } from "tailwindcss";

/**
 * Branding centralizado de ELEVEN ASCENSORES.
 * Cambiar la paleta acá (y las variables CSS espejo en app/globals.css)
 * actualiza toda la web.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4080E0", // azul Eleven (primario)
          dark: "#1A54B6", //    sombras / profundidad
          light: "#73B3F7", //   highlights / glow
          hover: "#497BD2", //   estados hover
        },
        ink: "#0A0E1A", //       neutro oscuro (fondos)
        snow: "#F2F5FA", //      neutro claro (texto sobre oscuro)
        steel: "#C4CBD6", //     gris acero (superficies metálicas)
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        // Gradiente cromado de marca: azul oscuro → primario → claro
        chrome:
          "linear-gradient(135deg, #1A54B6 0%, #4080E0 45%, #73B3F7 70%, #4080E0 100%)",
        "chrome-soft":
          "linear-gradient(180deg, rgba(115,179,247,0.25) 0%, rgba(64,128,224,0.08) 100%)",
      },
      boxShadow: {
        glow: "0 0 24px 4px rgba(115,179,247,0.45)",
        "glow-sm": "0 0 12px 2px rgba(115,179,247,0.35)",
        "inner-chrome":
          "inset 0 1px 0 rgba(242,245,250,0.35), inset 0 -2px 6px rgba(10,14,26,0.55)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 18px 2px rgba(115,179,247,0.35)" },
          "50%": { boxShadow: "0 0 34px 8px rgba(115,179,247,0.6)" },
        },
        "drift-slow": {
          "0%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(4%, -6%, 0) scale(1.08)" },
          "100%": { transform: "translate3d(0,0,0) scale(1)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
        "drift-slow": "drift-slow 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
