# Verify — Eleven landing 3D

Cómo verificar cambios de la experiencia scroll-driven en runtime.

## Build + servir

- El dev server del usuario suele ocupar el puerto 3000 y **comparte `.next`**
  con `next build` / `next start`: rebuildear pisa sus artefactos (se recupera
  con un refresh). Servir la verificación en otro puerto:
  `npm run build; npx next start -p 3210`.

## Driving (Playwright)

- `playwright` se instala en el scratchpad (`npm i playwright`) y se lanza con
  `channel: "msedge"` (sin descargar browsers).
- **`headless: true` NO sirve**: WebGL cae a SwiftShader (~1 fps) y GSAP no
  avanza. **Ventana headed y VISIBLE** (`--window-position=60,60`): si queda
  fuera de pantalla, Edge la considera ocluida y estrangula el rAF aunque se
  pasen los flags de anti-throttling.
- Aun headed, este equipo rinde ~2 fps con tier "high" en movimiento. Usar
  **viewport < 768 px de ancho** (fuerza tier "low", misma lógica) y
  **esperas fijas largas (8 s) en vez de detectar "scroll estable"** — el
  main thread se congela segundos al compilar shaders y engaña cualquier
  detector de quietud.
- Entrada al ride: click en `[aria-label="Llamar ascensor"]` (esperar que se
  deshabilite `disabled`), luego esperar `document.body.style.overflow === ""`
  (fase ride). Hacer una pasada de calentamiento (`End`, esperar, `Home`)
  antes de medir: el primer recorrido compila shaders.
- Gestos: rueda = `WheelEvent` despachado a `window` (los streams de momentum
  generarlos EN la página con `setInterval`, no con `evaluate` por evento: los
  round-trips meten pausas > MOMENTUM_GAP y rompen el swallow). Touch real =
  CDP `Input.dispatchTouchEvent` con contexto `hasTouch: true`.
- Paradas esperadas: `[0, ...FLOOR_STOPS × (spacerH − vh), min(spacerH, maxScroll)]`
  con `FLOOR_STOPS = 0.34 + (i + 0.6) × 0.13` (ver `lib/ridePath.ts`).
- Script de referencia que ya funcionó: `drive.js` (sesión 2026-07-10, 10/10
  aserciones desktop rueda/teclado/timeline + mobile swipes CDP).
