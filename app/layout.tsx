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

export const metadata: Metadata = {
  title: "ELEVEN Ascensores — Mantenimiento, instalación y urgencias 24hs en Santa Fe",
  description:
    "Empresa de Santa Fe dedicada al mantenimiento, instalación y modernización de ascensores para consorcios y administradoras de edificios. Atención inmediata las 24 horas.",
  icons: { icon: "/brand/eleven-logo.png" },
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
