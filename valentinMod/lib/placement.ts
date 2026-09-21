import { ASPECT } from './flower';
import type { Rng } from './random';

export interface Viewport {
  width: number;
  height: number;
}

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PlantedFlower {
  id: number;
  seed: number;
  /** Posición horizontal del punto de plantado, en % del ancho de la ventana. */
  xPct: number;
  /** Altura del punto de plantado, en % del alto de la ventana (desde abajo). */
  bottomPct: number;
  /** Ancho renderizado en px. */
  width: number;
  /** Capa de profundidad: las flores chicas quedan detrás. */
  z: number;
  swayDuration: number;
  swayDelay: number;
  swayAmount: number;
}

/** Margen de respeto alrededor del contenido central. */
const CONTENT_MARGIN = 28;
/** Margen mínimo contra los bordes de la ventana. */
const EDGE = 8;

interface Band {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  weight: number;
}

/**
 * Elige un punto de plantado en las franjas libres alrededor del contenido:
 * el lateral izquierdo, el derecho, o la banda que queda por debajo del texto.
 *
 * Cada franja se pondera por el área que realmente tiene disponible, así que
 * en pantallas anchas las flores tienden a los laterales y en pantallas
 * angostas (donde el texto ocupa todo el ancho) caen a la banda inferior.
 */
export function pickSpot(
  rng: Rng,
  content: Rect | null,
  viewport: Viewport,
  flowerWidth: number,
): { xPct: number; bottomPct: number } {
  const { width: W, height: H } = viewport;
  const halfW = flowerWidth / 2;
  const fullH = flowerWidth * ASPECT;
  const bands: Band[] = [];

  if (content) {
    const safe: Rect = {
      left: content.left - CONTENT_MARGIN,
      right: content.right + CONTENT_MARGIN,
      top: content.top - CONTENT_MARGIN,
      bottom: content.bottom + CONTENT_MARGIN,
    };

    // Las flores laterales pueden subir hasta media pantalla.
    const sideTop = H * 0.42;

    const leftMax = safe.left - halfW;
    const leftMin = EDGE + halfW;
    if (leftMax - leftMin > 12) {
      bands.push({ x0: leftMin, x1: leftMax, y0: 0, y1: sideTop, weight: (leftMax - leftMin) * sideTop });
    }

    const rightMin = safe.right + halfW;
    const rightMax = W - EDGE - halfW;
    if (rightMax - rightMin > 12) {
      bands.push({ x0: rightMin, x1: rightMax, y0: 0, y1: sideTop, weight: (rightMax - rightMin) * sideTop });
    }

    // Banda inferior: la flor entera debe quedar por debajo del contenido.
    const bottomMax = H - safe.bottom - fullH;
    if (bottomMax > 8) {
      const x0 = EDGE + halfW;
      const x1 = W - EDGE - halfW;
      bands.push({ x0, x1, y0: 0, y1: bottomMax, weight: (x1 - x0) * bottomMax });
    }
  }

  if (bands.length === 0) {
    // Pantalla demasiado ocupada: pegada a un borde inferior, casi a ras del suelo.
    const onLeft = rng.chance(0.5);
    const x = onLeft ? EDGE + halfW : W - EDGE - halfW;
    return { xPct: (x / W) * 100, bottomPct: rng.range(0, H * 0.05) / H * 100 };
  }

  const total = bands.reduce((sum, b) => sum + b.weight, 0);
  let ticket = rng.next() * total;
  let band = bands[bands.length - 1]!;
  for (const candidate of bands) {
    if (ticket < candidate.weight) {
      band = candidate;
      break;
    }
    ticket -= candidate.weight;
  }

  const x = rng.range(band.x0, band.x1);
  const y = rng.range(band.y0, band.y1);

  // Se guarda en porcentajes para que el jardín acompañe los cambios de tamaño
  // de la ventana en vez de quedar clavado a píxeles de un viewport viejo.
  return { xPct: (x / W) * 100, bottomPct: (y / H) * 100 };
}

export function createPlantedFlower(
  id: number,
  rng: Rng,
  content: Rect | null,
  viewport: Viewport,
): PlantedFlower {
  const compact = viewport.width < 640;
  const width = rng.range(compact ? 46 : 62, compact ? 96 : 136);
  const spot = pickSpot(rng, content, viewport, width);

  return {
    id,
    seed: Math.floor(rng.next() * 2 ** 31),
    xPct: spot.xPct,
    bottomPct: spot.bottomPct,
    width,
    z: Math.round(width),
    swayDuration: rng.range(5.5, 9),
    swayDelay: rng.range(0, 2.4),
    swayAmount: rng.range(0.8, 2.2),
  };
}
