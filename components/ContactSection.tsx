"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CONTACT, TRUST } from "@/data/services";
import { ArrowUpIcon } from "./CallButton";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const WA_LINK = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
  "Hola, necesito información sobre sus servicios",
)}`;

/**
 * Sección final de contacto: CTA de presupuesto + datos reales + footer.
 * Sección DOM normal que cubre el canvas al final del recorrido.
 * `animate=false` para la versión accesible.
 */
export function ContactSection({ animate = true }: { animate?: boolean }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!animate || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".contact-reveal", {
        y: 36,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [animate]);

  return (
    <section
      id="contacto"
      ref={rootRef}
      className="relative z-10 bg-ink"
      aria-label="Contacto"
    >
      <div className="chrome-line" />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center md:py-32">
        <p className="contact-reveal mb-4 text-xs font-medium tracking-[0.4em] text-brand-light/90">
          CONTACTO
        </p>

        <h2 className="contact-reveal font-display text-4xl font-semibold text-snow md:text-6xl">
          Hablemos de tu ascensor
        </h2>
        <p className="contact-reveal mt-5 max-w-xl text-sm leading-relaxed text-steel md:text-base">
          Contanos qué necesita tu edificio — instalación, mantenimiento,
          modernización o una urgencia — y nos ponemos en contacto a la
          brevedad. Atendemos consorcios, administradoras y particulares.
        </p>

        <div className="contact-reveal mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUST.map((t) => (
            <span
              key={t}
              className="flex items-center gap-2 text-xs text-steel/80"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-light" aria-hidden />
              {t}
            </span>
          ))}
        </div>

        {/* CTA con lenguaje de botonera de ascensor */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-reveal group mt-12 flex flex-col items-center gap-5"
        >
          <span className="elevator-button animate-pulse-glow h-[132px] w-[132px]">
            <ArrowUpIcon size={44} />
          </span>
          <span className="font-display text-lg font-medium tracking-[0.18em] text-snow transition-colors group-hover:text-brand-light">
            SOLICITAR PRESUPUESTO
          </span>
        </a>

        <dl className="contact-reveal mt-16 grid w-full max-w-2xl grid-cols-1 gap-6 text-sm sm:grid-cols-3">
          {[
            { dt: "Teléfono", dd: CONTACT.phone, href: `tel:${CONTACT.phoneRaw}` },
            { dt: "Email", dd: CONTACT.email, href: `mailto:${CONTACT.email}` },
            { dt: "Zona de trabajo", dd: CONTACT.city },
          ].map((item) => (
            <div key={item.dt} className="flex flex-col gap-1">
              <dt className="text-[10px] tracking-[0.3em] text-steel/60">
                {item.dt.toUpperCase()}
              </dt>
              <dd>
                {item.href ? (
                  <a
                    href={item.href}
                    className="break-words text-snow transition-colors hover:text-brand-light"
                  >
                    {item.dd}
                  </a>
                ) : (
                  <span className="text-snow">{item.dd}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/eleven-logo.png"
            alt="Eleven Ascensores"
            className="h-10 w-auto"
          />
          <p className="text-center text-xs text-steel/50">
            © {new Date().getFullYear()} {CONTACT.name} — {CONTACT.city}
          </p>
        </div>
      </footer>
    </section>
  );
}
