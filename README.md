# Happy Yellow Flowers Day 🌻

Una página de celebración construida con **Next.js 15 (App Router) + React 19 + TypeScript**,
pensada para desplegar en Vercel.

## Las dos interacciones

**Plantar una flor** — cada clic hace crecer un girasol en una zona libre alrededor del
contenido. El tallo brota desde abajo, las hojas se abren y los pétalos se despliegan en
cascada con un easing elástico (~0.8 s). Las flores se acumulan y quedan meciéndose con el
viento; cada una tiene su propia semilla, así que ninguna se repite.

**Celebrar** — dispara una lluvia de pétalos que cae sobre toda la pantalla, con velocidades,
tamaños, rotaciones y balanceo propios, más una brisa global que las mueve en conjunto. Los
pétalos giran sobre su eje y muestran el envés más apagado al pasar de canto. Se eliminan al
salir de pantalla y el bucle se detiene solo cuando no queda ninguno.

## Las flores

No son imágenes: se generan como SVG desde `lib/flower.ts`, lo que permite que crezcan,
que cambien de paleta y que escalen sin pixelarse.

- El centro sigue la **filotaxis real de un girasol**: las semillas se distribuyen sobre una
  espiral de Fermat usando el ángulo áureo (137.5°). De ahí sale el entramado de espirales
  que hace que el disco se lea como una flor y no como un círculo marrón.
- Dos coronas de pétalos (la trasera más larga y oscura, desfasada medio paso) dan volumen,
  y cada pétalo lleva su propio largo, ancho y desviación de punta para que no parezca un
  molinillo geométrico.
- Las hojas se insertan sobre la curva real del tallo, no sobre el eje vertical.
- El nivel de detalle sigue al tamaño en pantalla: una flor chica no gasta nodos en
  nervaduras que nadie va a ver.

## Estructura

```
app/
  layout.tsx        Fuentes (next/font), metadata, estilos globales
  page.tsx          Server Component: toda la copia se renderiza en el servidor
  globals.css       Tokens de color, fondo, grano de papel
components/
  Scene.tsx         Client Component: estado del jardín y los botones
  Flower.tsx        La flor en SVG (determinista: misma semilla = misma flor)
  PetalRain.tsx     Lluvia de pétalos sobre <canvas> con requestAnimationFrame
lib/
  flower.ts         Geometría botánica: pétalos, disco, tallo, hojas
  placement.ts      Dónde plantar sin tapar el contenido central
  random.ts         PRNG determinista (mulberry32)
legacy/             La versión original en HTML/CSS/JS vanilla
```

Solo `Scene` y `PetalRain` se hidratan en el cliente; el texto viaja como HTML ya
renderizado y recibido como `children`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

## Desplegar en Vercel

El repositorio tiene el proyecto dentro de `valentinMod/`, así que hay que indicárselo a
Vercel:

1. Importar el repo en [vercel.com/new](https://vercel.com/new).
2. En **Root Directory**, elegir `valentinMod`.
3. El resto queda en automático (Vercel detecta Next.js). Deploy.

Por CLI, desde esta carpeta:

```bash
npx vercel        # preview
npx vercel --prod
```

## Accesibilidad

Todo el movimiento —florecimiento, vaivén, lluvia de pétalos y entradas de texto— respeta
`prefers-reduced-motion`. Las capas decorativas están marcadas como `aria-hidden` y el
contador del jardín se anuncia vía `aria-live`.
