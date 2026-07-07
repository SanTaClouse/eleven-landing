"use client";

import { setState, useExperience } from "@/lib/store";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        fill="currentColor"
        opacity={muted ? 0.5 : 1}
      />
      {muted ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/**
 * Header fijo minimalista: logo + mute + acceso a la versión accesible.
 * Queda debajo del preloader (z-50) hasta que arranca la experiencia.
 */
export function Header({ onAccessible }: { onAccessible: () => void }) {
  const muted = useExperience((s) => s.muted);

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/eleven-logo.png"
        alt="Eleven Ascensores"
        className="h-7 w-auto md:h-8"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setState({ muted: !muted })}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          aria-pressed={muted}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink/60 text-steel backdrop-blur transition-colors hover:border-brand/50 hover:text-brand-light"
        >
          <SpeakerIcon muted={muted} />
        </button>
        <button
          type="button"
          onClick={onAccessible}
          className="pointer-events-auto rounded-full border border-white/10 bg-ink/60 px-4 py-2 text-xs tracking-wide text-steel backdrop-blur transition-colors hover:border-brand/50 hover:text-brand-light"
        >
          Versión accesible
        </button>
      </div>
    </header>
  );
}
