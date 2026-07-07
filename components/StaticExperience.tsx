"use client";

import { CONTACT, SERVICES, TRUST } from "@/data/services";
import { ArrowUpIcon } from "./CallButton";
import { ContactSection } from "./ContactSection";

const WA_LINK = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
  "Hola, necesito información sobre sus servicios",
)}`;

/**
 * Versión accesible / degradada: mismas secciones y contenido que la
 * experiencia 3D pero como layout estático navegable. Se usa cuando:
 *  - prefers-reduced-motion está activo
 *  - no hay WebGL disponible
 *  - el usuario la elige manualmente ("Versión accesible")
 */
export function StaticExperience({ onImmersive }: { onImmersive: () => void }) {
  return (
    <div className="bg-ink">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-ink/80 px-5 py-4 backdrop-blur md:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/eleven-logo.png"
          alt="Eleven Ascensores"
          className="h-7 w-auto md:h-8"
        />
        <nav className="flex items-center gap-3">
          <a
            href="#servicios"
            className="hidden text-xs tracking-wide text-steel transition-colors hover:text-brand-light sm:block"
          >
            Servicios
          </a>
          <a
            href="#contacto"
            className="hidden text-xs tracking-wide text-steel transition-colors hover:text-brand-light sm:block"
          >
            Contacto
          </a>
          <button
            type="button"
            onClick={onImmersive}
            className="rounded-full border border-white/10 bg-ink/60 px-4 py-2 text-xs tracking-wide text-steel transition-colors hover:border-brand/50 hover:text-brand-light"
          >
            Experiencia inmersiva
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(26,84,182,0.28) 0%, transparent 70%)",
          }}
        />
        <h1 className="sr-only">
          ELEVEN Ascensores — Mantenimiento, instalación y modernización de
          ascensores en Santa Fe
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/eleven-logo.png"
          alt="ELEVEN Ascensores"
          className="w-80 max-w-[85vw] drop-shadow-[0_0_36px_rgba(64,128,224,0.55)] md:w-[560px]"
        />
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-steel md:text-base">
          Somos una empresa de Santa Fe dedicada al mantenimiento, instalación
          y modernización de ascensores para consorcios y administradoras de
          edificios. Atención inmediata las 24 horas.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUST.map((t) => (
            <span key={t} className="flex items-center gap-2 text-xs text-steel/80">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-light" aria-hidden />
              {t}
            </span>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4"
            aria-label="Contactar por WhatsApp"
          >
            <span className="elevator-button h-24 w-24">
              <ArrowUpIcon size={30} />
            </span>
            <span className="text-[11px] tracking-[0.35em] text-steel/70 transition-colors group-hover:text-brand-light">
              CONTACTANOS
            </span>
          </a>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="mx-auto max-w-5xl px-6 py-20">
        <p className="mb-2 text-center text-[10px] font-medium tracking-[0.4em] text-brand-light/80">
          NUESTROS SERVICIOS
        </p>
        <h2 className="mb-10 text-center font-display text-3xl font-semibold text-snow">
          Soluciones integrales para ascensores
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {SERVICES.map((service) => (
            <article key={service.title} className="glass-panel p-8">
              <h3 className="font-display text-xl font-semibold text-snow md:text-2xl">
                {service.title}
              </h3>
              <div className="chrome-line my-4 w-16" />
              <p className="text-sm leading-relaxed text-steel">
                {service.description}
              </p>
              <ul className="mt-5 flex flex-col gap-2">
                {service.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 text-xs text-brand-light/90"
                  >
                    <span className="inline-block h-1 w-4 rounded bg-brand" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
              {service.stat && (
                <div className="mt-6 border-t border-white/5 pt-5">
                  <span
                    className="font-display text-3xl font-semibold tabular-nums"
                    style={{
                      color: "#a8ccff",
                      textShadow:
                        "0 0 10px rgba(115,179,247,0.9), 0 0 28px rgba(64,128,224,0.5)",
                    }}
                  >
                    {service.stat.value}
                    {service.stat.suffix ?? ""}
                  </span>
                  <p className="mt-1 text-xs text-steel">{service.stat.label}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <ContactSection animate={false} />
    </div>
  );
}
