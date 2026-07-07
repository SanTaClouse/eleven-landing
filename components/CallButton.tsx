"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Flecha ▲ estilo botonera de ascensor */
export function ArrowUpIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 4.5 20 15h-5v4.5H9V15H4L12 4.5Z"
        fill="currentColor"
        stroke="rgba(10,14,26,0.35)"
        strokeWidth="0.6"
      />
    </svg>
  );
}

/**
 * Botón físico de ascensor: circular, relieve metálico cromado azul,
 * glow #73B3F7 en hover (ver .elevator-button en globals.css).
 * Se usa para llamar la cabina en el preloader y como CTA final.
 */
export function ElevatorButton({
  size = 112,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: number;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`elevator-button ${className}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children ?? <ArrowUpIcon size={size * 0.32} />}
    </button>
  );
}
