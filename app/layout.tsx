import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const TITLE =
  "ELEVEN Ascensores — Mantenimiento, instalación y urgencias 24hs en Santa Fe";
const DESCRIPTION =
  "Empresa de Santa Fe dedicada al mantenimiento, instalación y modernización de ascensores para consorcios y administradoras de edificios. Atención inmediata las 24 horas.";

// URL canónica: definir NEXT_PUBLIC_SITE_URL cuando haya dominio propio;
// mientras tanto Vercel expone la URL de producción del proyecto.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // favicon/íconos: app/favicon.ico, app/icon.png y app/apple-icon.png
  // (generados desde la "E" del logo, auto-detectados por Next)
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "ELEVEN Ascensores",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ELEVEN Ascensores — Mantenimiento, instalación y modernización en Santa Fe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0E1A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} bg-ink font-body text-snow antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
