"use client";

/**
 * Display de cabina moderno — panel digital tipo TFT (como las botoneras
 * KONE/Schindler actuales): vidrio oscuro, dígito en Space Grotesk con glow
 * azul Eleven. Sin assets externos.
 *
 * variant="panel" → con marco de vidrio oscuro (preloader, contacto, cards)
 * variant="bare"  → solo el dígito luminoso (para incrustar en el HUD)
 */
export function Display({
  value,
  height = 64,
  className = "",
  label,
  variant = "panel",
}: {
  /** Texto a mostrar: dígitos, "PB" */
  value: string;
  height?: number;
  className?: string;
  /** aria-label opcional (ej: "Piso 3") */
  label?: string;
  variant?: "panel" | "bare";
}) {
  const digit = (
    <span
      className="font-display font-semibold leading-none tabular-nums"
      style={{
        fontSize: height * (variant === "panel" ? 0.56 : 0.72),
        letterSpacing: "0.05em",
        color: "#a8ccff",
        textShadow:
          "0 0 10px rgba(115,179,247,0.9), 0 0 30px rgba(64,128,224,0.5)",
      }}
    >
      {value}
    </span>
  );

  if (variant === "bare") {
    return (
      <span
        role="status"
        aria-label={label ?? `Piso ${value}`}
        className={`inline-flex items-center ${className}`}
        style={{ height }}
      >
        {digit}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-label={label ?? `Piso ${value}`}
      className={`inline-flex items-center justify-center rounded-xl border border-brand/25 ${className}`}
      style={{
        height,
        minWidth: height * 1.15,
        padding: `0 ${Math.round(height * 0.26)}px`,
        background: "linear-gradient(180deg, #0c1424 0%, #060a14 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(242,245,250,0.07), inset 0 0 20px rgba(64,128,224,0.14), 0 0 26px rgba(64,128,224,0.2)",
      }}
    >
      {digit}
    </div>
  );
}
