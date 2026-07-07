# ELEVEN ASCENSORES — Landing scroll-driven 3D

Landing inmersiva de **Eleven Ascensores** (Santa Fe, Argentina). Toda la
animación es una escena 3D en tiempo real (React Three Fiber) controlada por
scroll: el usuario **llama el ascensor**, entra a la cabina y cada piso que
sube revela un servicio de la empresa. Sin video pregrabado.

**Stack:** Next.js 14 (App Router) · TypeScript · React Three Fiber · drei ·
GSAP + ScrollTrigger · Lenis (smooth scroll) · Tailwind CSS · lottie-react
(opcional para el display).

---

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
npm start        # servir el build
```

## La experiencia

1. **Preloader** — botón físico de ascensor con aro de progreso. Se habilita
   cuando la escena 3D terminó de precargar.
2. **Llamada** — al click, el display 7-seg cuenta 8 → PB con "ding" al
   llegar (WebAudio sintetizado, muteable desde el header).
3. **Barrido de intro** — la cámara vuela desde la vista aérea del edificio
   hasta la puerta del ascensor. Se desbloquea el scroll.
4. **Ride** — el scroll controla todo: dolly-in, apertura de puertas, entrada
   a la cabina, subida piso a piso (PB → 1 → 2 → 3 → 4). En cada piso las
   puertas 3D se abren y aparece el panel del servicio, en sincronía exacta.
5. **Piso 5 / Recepción** — sección de contacto con CTA "Solicitar
   presupuesto" estilo botonera.

## Dónde tocar cada cosa

| Qué                        | Dónde                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| **Servicios (textos)**     | [`data/services.ts`](data/services.ts) — títulos, descripciones, bullets y datos de contacto (reales, tomados del sitio anterior). El orden del array define los pisos. |
| **Branding / paleta**      | [`tailwind.config.ts`](tailwind.config.ts) (`theme.extend.colors`) + variables CSS espejo en [`app/globals.css`](app/globals.css). El azul primario es `brand` (#4080E0). |
| **Logos**                  | `public/brand/eleven-logo.png` — versión con alfa real generada desde `images/` (el original traía el fondo negro baked-in). |
| **Tipografías**            | [`app/layout.tsx`](app/layout.tsx) — Space Grotesk (títulos) + Inter (cuerpo) vía `next/font`. |
| **Timing scroll ↔ 3D**     | [`lib/ridePath.ts`](lib/ridePath.ts) — TODO el recorrido es una función pura del progreso de scroll. Fases, sub-timing de puertas y ventanas de paneles viven acá; no hay números de timing en ningún otro archivo. |
| **Largo del scroll**       | `Experience.tsx` — el spacer de `700vh`. |

## Reemplazar el modelo 3D placeholder por un GLB real

El ascensor y el edificio están construidos con **primitivas metálicas**
(marcadas como `PLACEHOLDER 3D` en el código) para que la mecánica scroll sea
perfecta desde el día uno.

1. Poné tu modelo en `public/models/elevator.glb`.
2. En [`components/three/Elevator.tsx`](components/three/Elevator.tsx):
   ```tsx
   const { scene } = useGLTF("/models/elevator.glb");
   // a nivel módulo:
   useGLTF.preload("/models/elevator.glb");
   ```
   Renderizá `<primitive object={scene} />` dentro del `<group>` raíz de la
   cabina y mapeá los nodos de puertas a `handles.doorL` / `handles.doorR`.
   **Contrato con la animación:** el grupo raíz se mueve en Y; las puertas
   deslizan en X (`±(0.335 + 0.685·apertura)` en el placeholder — ajustá la
   constante en `RigController.tsx` a tu modelo).
3. Lo mismo aplica al edificio ([`Building.tsx`](components/three/Building.tsx)):
   mantené libre el canal frontal `x ∈ [-1.7, 1.7]`, `y ∈ [0, 17]` por donde
   viaja la cabina.

## Arquitectura de la sincronización (los puntos delicados)

```
rueda / touch
   │
   ▼
Lenis (smooth scroll inercial: la rueda no avanza "a saltos")
   │
   ▼
ScrollController ── ScrollTrigger mapea el spacer (700vh) → targetProgress
   │
   ▼  (store pub/sub, sin re-renders)
RigController (useFrame, 60fps)
   ├─ suaviza targetProgress → progress (damping exponencial)
   ├─ rideStateAt(progress) → cámara, cabina, puertas, luces  [lib/ridePath.ts]
   └─ publica progress/floor al store
        │
        ├─ ServicePanels: opacidad de paneles con panelWindow(i) — la misma
        │  fuente de timing que abre las puertas 3D
        ├─ Hud: display de piso + flecha de movimiento
        └─ RideOverlays: titular y hint de scroll
```

La clave: **un solo valor de progreso suavizado** alimenta 3D y DOM, y **un
solo archivo** (`lib/ridePath.ts`) define los rangos. Cambiar un rango ahí
mantiene todo sincronizado.

## Display de cabina

Panel digital moderno (tipografía Space Grotesk con glow azul sobre vidrio
oscuro) en [`components/Display.tsx`](components/Display.tsx), y su gemelo 3D
dibujado a CanvasTexture dentro de `components/three/Elevator.tsx`. Si
preferís un Lottie, `lottie-react` ya está instalado: reemplazá el contenido
de `Display.tsx` por `<Lottie animationData={...} />` conservando la prop
`value`. El número de piso vive únicamente en el HUD superior (y en los
displays 3D de la cabina); los paneles de servicio muestran solo el contenido
de la empresa.

## Accesibilidad y rendimiento

- **`prefers-reduced-motion` / sin WebGL** → se sirve automáticamente la
  **versión accesible** (`components/StaticExperience.tsx`): mismas secciones
  y contenido, layout estático navegable. También se puede alternar a mano
  ("Versión accesible" / "Experiencia inmersiva"; la elección persiste en
  `localStorage`).
- **Mobile / hardware modesto** → tier "low" automático: DPR limitado, sin
  piso reflectivo, sin partículas, sin sombras (`lib/quality.ts`).
- La escena 3D se carga lazy (`next/dynamic`, `ssr: false`); el preloader es
  el fallback de Suspense de facto.
- Sonido opcional sintetizado con WebAudio (`lib/audio.ts`), muteable, sin
  autoplay (se inicializa con el gesto del click).
