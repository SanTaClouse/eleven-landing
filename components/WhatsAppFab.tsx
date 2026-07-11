"use client";

import { CONTACT } from "@/data/services";
import { useExperience } from "@/lib/store";

const WA_LINK = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
  "Hola, necesito información sobre sus servicios",
)}`;

/**
 * Acceso directo a WhatsApp, discreto y siempre visible (incluso sobre el
 * preloader): quien llega buscando contacto no tiene que recorrer toda la
 * experiencia para escribir.
 *
 * Al entrar, un cartel acompaña al botón ("Contacto directo con el dueño")
 * como gancho de bienvenida; se retira apenas el visitante toca "Llamar
 * ascensor" (la fase deja de ser loading/ready), para no competir con la
 * experiencia una vez iniciada.
 */
export function WhatsAppFab() {
  const phase = useExperience((s) => s.phase);
  const showLabel = phase === "loading" || phase === "ready";

  return (
    <div className="fixed bottom-3 right-3 z-[60] flex items-center gap-2 md:bottom-5 md:right-5">
      <span
        aria-hidden={!showLabel}
        className={`pointer-events-none max-w-[54vw] rounded-full border border-[#25D366]/30 bg-ink/80 px-3 py-1.5 text-right text-[11px] font-medium leading-tight text-snow/90 backdrop-blur transition-all duration-500 md:text-xs ${
          showLabel ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
        }`}
        style={{
          textShadow: "0 1px 6px rgba(3,6,14,0.85)",
          boxShadow: "0 2px 12px rgba(3,6,14,0.55)",
        }}
      >
        Contacto directo con el dueño
      </span>
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        title="Contactar por WhatsApp"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#25D366]/35 bg-ink/70 text-[#25D366] backdrop-blur transition-transform duration-200 hover:scale-110"
        style={{
          boxShadow: "0 2px 14px rgba(3,6,14,0.65), 0 0 16px rgba(37,211,102,0.22)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
