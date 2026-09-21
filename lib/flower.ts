import { createRng, mixHex, n, r } from './random';

/**
 * Geometría botánica de una flor.
 *
 * Todo se dibuja dentro de un `viewBox` fijo de 200 × 340 en el que:
 *   - el centro de la corola está exactamente en (100, 100);
 *   - la base del tallo está exactamente en (100, 340), es decir, el
 *     borde inferior-centro de la caja.
 *
 * Esas dos constantes son las que usan las animaciones como `transform-origin`
 * (la corola pivota en su centro, el tallo crece desde su base) y son las que
 * permiten posicionar la flor en pantalla por su punto de plantado.
 */

export const VIEW_W = 200;
export const VIEW_H = 340;
export const VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;
export const ASPECT = VIEW_H / VIEW_W;

/** Centro de la corola en coordenadas del viewBox. */
export const HEAD_X = 100;
export const HEAD_Y = 100;
/** Base del tallo (punto de plantado). */
export const ROOT_X = 100;
export const ROOT_Y = 340;

export interface FlowerPalette {
  id: string;
  name: string;
  petalTip: string;
  petalMid: string;
  petalBase: string;
  petalBack: string;
  petalBackTip: string;
  discInner: string;
  discOuter: string;
  discRim: string;
  crown: string;
  stem: string;
  stemDark: string;
  leaf: string;
  leafDark: string;
}

export const PALETTES: readonly FlowerPalette[] = [
  {
    id: 'girasol',
    name: 'Girasol',
    petalTip: '#FFE58A',
    petalMid: '#FBC63A',
    petalBase: '#DE8E10',
    petalBack: '#C9790B',
    petalBackTip: '#F0B444',
    discInner: '#3B2810',
    discOuter: '#8A571A',
    discRim: '#C68F31',
    crown: '#FFD861',
    stem: '#7E9553',
    stemDark: '#4B6331',
    leaf: '#88A257',
    leafDark: '#4A6230',
  },
  {
    id: 'limon',
    name: 'Limón',
    petalTip: '#FFF6C4',
    petalMid: '#FFE27C',
    petalBase: '#EFB92E',
    petalBack: '#E0A81F',
    petalBackTip: '#FFE9A0',
    discInner: '#4A3316',
    discOuter: '#9A6A24',
    discRim: '#D2A144',
    crown: '#FFE694',
    stem: '#889B5C',
    stemDark: '#546B36',
    leaf: '#93AA61',
    leafDark: '#526B34',
  },
  {
    id: 'ambar',
    name: 'Ámbar',
    petalTip: '#FFC85A',
    petalMid: '#F5A017',
    petalBase: '#C66A06',
    petalBack: '#AE5C05',
    petalBackTip: '#EFAA34',
    discInner: '#31200C',
    discOuter: '#7A4714',
    discRim: '#B8792A',
    crown: '#FFC24A',
    stem: '#748A4C',
    stemDark: '#44592C',
    leaf: '#7E9850',
    leafDark: '#43592B',
  },
  {
    id: 'miel',
    name: 'Miel',
    petalTip: '#FFEBA6',
    petalMid: '#F8D057',
    petalBase: '#D89A1C',
    petalBack: '#C68914',
    petalBackTip: '#F7D77E',
    discInner: '#422C12',
    discOuter: '#8F5F1E',
    discRim: '#CA9639',
    crown: '#FFE07C',
    stem: '#809657',
    stemDark: '#4E6633',
    leaf: '#8DA55C',
    leafDark: '#4E6733',
  },
];

export interface PetalSpec {
  /** `d` del pétalo, con la base ya situada en el centro de la corola. */
  d: string;
  /** Nervadura central, un hairline claro sobre el pétalo. */
  vein: string;
  /** Rotación estática alrededor del centro de la corola, en grados. */
  angle: number;
  /** Retardo de la animación de despliegue, en ms. */
  delay: number;
}

export interface DiscSeed {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angle: number;
  fill: string;
  opacity: number;
}

export interface LeafSpec {
  d: string;
  midrib: string;
  veins: string[];
  originX: number;
  originY: number;
  angle: number;
  delay: number;
  flip: boolean;
}

export interface FlowerModel {
  palette: FlowerPalette;
  backPetals: PetalSpec[];
  frontPetals: PetalSpec[];
  stem: string;
  leaves: LeafSpec[];
  disc: {
    radius: number;
    seeds: DiscSeed[];
    crown: string;
  };
  /** Duración total del florecimiento, en ms. */
  bloomDuration: number;
}

/** Punto de una curva cuadrática de Bézier en `t`. */
function quadPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number,
): [number, number] {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

/**
 * Pétalo: lágrima alargada con la punta ligeramente desviada (`skew`), lo que
 * evita el aspecto de "molinillo" perfecto de un pinwheel geométrico.
 */
function petalPath(len: number, width: number, skew: number): string {
  const w = width / 2;
  const x = HEAD_X;
  const y = HEAD_Y;
  return [
    `M${n(x)} ${n(y)}`,
    `C${n(x + w)} ${n(y - len * 0.2)} ${n(x + w * 0.64)} ${n(y - len * 0.8)} ${n(x + skew)} ${n(y - len)}`,
    `C${n(x - w * 0.64)} ${n(y - len * 0.8)} ${n(x - w)} ${n(y - len * 0.2)} ${n(x)} ${n(y)}`,
    'Z',
  ].join('');
}

function petalVein(len: number, skew: number): string {
  const x = HEAD_X;
  const y = HEAD_Y;
  return `M${n(x)} ${n(y - len * 0.1)}Q${n(x + skew * 0.5)} ${n(y - len * 0.55)} ${n(x + skew * 0.85)} ${n(y - len * 0.9)}`;
}

const STEM_TOP_Y = HEAD_Y + 12;

/** Puntos de control de la línea central del tallo, para un `bend` dado. */
function stemSpine(bend: number): [number, number][] {
  const h = ROOT_Y - STEM_TOP_Y;
  return [
    [HEAD_X, STEM_TOP_Y],
    [HEAD_X + bend, STEM_TOP_Y + h * 0.38],
    [ROOT_X + bend * 0.7, STEM_TOP_Y + h * 0.74],
    [ROOT_X, ROOT_Y],
  ];
}

/**
 * Punto sobre la línea central del tallo en `t` ∈ [0, 1].
 * Es lo que permite colgar las hojas del tallo real: si se anclaran en x=100
 * quedarían flotando cada vez que el tallo se arquea.
 */
function stemPointAt(bend: number, t: number): [number, number] {
  const [p0, p1, p2, p3] = stemSpine(bend) as [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ];
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/** Tallo: polígono cerrado que se ensancha hacia la base y se arquea en el medio. */
function stemPath(bend: number, topWidth: number, rootWidth: number): string {
  const topY = STEM_TOP_Y;
  const h = ROOT_Y - topY;
  const y1 = topY + h * 0.38;
  const y2 = topY + h * 0.74;
  return [
    `M${n(HEAD_X - topWidth)} ${n(topY)}`,
    `C${n(HEAD_X - topWidth + bend)} ${n(y1)} ${n(ROOT_X - rootWidth + bend * 0.7)} ${n(y2)} ${n(ROOT_X - rootWidth)} ${n(ROOT_Y)}`,
    `L${n(ROOT_X + rootWidth)} ${n(ROOT_Y)}`,
    `C${n(ROOT_X + rootWidth + bend * 0.7)} ${n(y2)} ${n(HEAD_X + topWidth + bend)} ${n(y1)} ${n(HEAD_X + topWidth)} ${n(topY)}`,
    'Z',
  ].join('');
}

/** Hoja lanceolada con nervio central y tres pares de nervaduras laterales.
 *  Se dibuja apuntando hacia arriba desde (ax, ay); la inclinación real la
 *  aplica después la rotación, que pivota sobre ese mismo punto de inserción. */
function buildLeaf(ax: number, ay: number, len: number, width: number, curl: number) {
  const tip: [number, number] = [ax + curl, ay - len];
  const base: [number, number] = [ax, ay];
  const ctrl: [number, number] = [ax + curl * 0.5, ay - len * 0.55];

  const d = [
    `M${n(ax)} ${n(ay)}`,
    `C${n(ax + width)} ${n(ay - len * 0.3)} ${n(ax + width * 0.72)} ${n(ay - len * 0.82)} ${n(tip[0])} ${n(tip[1])}`,
    `C${n(ax - width * 0.72)} ${n(ay - len * 0.82)} ${n(ax - width)} ${n(ay - len * 0.3)} ${n(ax)} ${n(ay)}`,
    'Z',
  ].join('');

  const midrib = `M${n(ax)} ${n(ay)}Q${n(ctrl[0])} ${n(ctrl[1])} ${n(tip[0])} ${n(tip[1])}`;

  const veins: string[] = [];
  for (let k = 1; k <= 3; k++) {
    const t = k / 4.4;
    const [mx, my] = quadPoint(base, ctrl, tip, t);
    const reach = width * 0.8 * (1 - t * 0.5);
    for (const dir of [1, -1]) {
      veins.push(
        `M${n(mx)} ${n(my)}Q${n(mx + dir * reach * 0.6)} ${n(my - len * 0.03)} ${n(mx + dir * reach)} ${n(my - len * 0.11)}`,
      );
    }
  }

  return { d, midrib, veins };
}

/**
 * Corazón del girasol: las semillas se colocan siguiendo el ángulo áureo
 * (137.5°) sobre una espiral de Fermat, que es exactamente la filotaxis de un
 * girasol real. De ahí sale el entramado de espirales que hace que el centro
 * se lea como una flor y no como un círculo marrón.
 */
function buildDiscSeeds(count: number, radius: number, palette: FlowerPalette): DiscSeed[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const seeds: DiscSeed[] = [];
  for (let i = 0; i < count; i++) {
    // `t` se redondea antes de derivar nada de él: así tamaño, color y opacidad
    // salen de un valor idéntico en servidor y cliente.
    const t = r(Math.sqrt((i + 0.6) / count));
    const dist = t * radius * 0.92;
    const a = i * golden;
    const size = 0.55 + t * 1.5;
    seeds.push({
      cx: r(HEAD_X + Math.cos(a) * dist),
      cy: r(HEAD_Y + Math.sin(a) * dist),
      rx: r(size * 1.3),
      ry: r(size * 0.72),
      // Normalizado a [0, 360): el ángulo áureo acumulado llega a valores de
      // cinco cifras, donde el redondeo ya no basta para estabilizarlo.
      angle: r((((a * 180) / Math.PI) % 360 + 360) % 360),
      fill: mixHex(palette.discInner, palette.discRim, Math.min(1, t * 1.15)),
      opacity: r(0.55 + t * 0.4),
    });
  }
  return seeds;
}

/** Corona de flósculos: los pequeños pétalos tubulares del borde del disco. */
function buildCrown(count: number, radius: number): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r0 = radius * 0.86;
    const r1 = radius * 1.04;
    const spread = (Math.PI * 2) / count / 2.6;
    const x0 = HEAD_X + Math.cos(a - spread) * r0;
    const y0 = HEAD_Y + Math.sin(a - spread) * r0;
    const x1 = HEAD_X + Math.cos(a) * r1;
    const y1 = HEAD_Y + Math.sin(a) * r1;
    const x2 = HEAD_X + Math.cos(a + spread) * r0;
    const y2 = HEAD_Y + Math.sin(a + spread) * r0;
    parts.push(`M${n(x0)} ${n(y0)}Q${n(x1)} ${n(y1)} ${n(x2)} ${n(y2)}Z`);
  }
  return parts.join('');
}

export interface BuildFlowerOptions {
  /** Pétalos por corona (se dibujan dos coronas). */
  petals?: number;
  /** Semillas del disco central. Menos = más liviano en el DOM. */
  discSeeds?: number;
  palette?: FlowerPalette;
}

export function buildFlower(seed: number, options: BuildFlowerOptions = {}): FlowerModel {
  const rng = createRng(seed);
  const palette = options.palette ?? rng.pick(PALETTES);
  const petalCount = options.petals ?? rng.int(12, 15);
  const seedCount = options.discSeeds ?? 90;

  // En un girasol real el disco ocupa ~40% del diámetro de la corola.
  const discRadius = rng.range(30, 35);
  const baseLen = rng.range(62, 74);
  const baseWidth = baseLen * rng.range(0.3, 0.38);
  const step = 360 / petalCount;

  // Corona trasera: pétalos algo más largos y oscuros, desfasados medio paso.
  // Es lo que da volumen y evita que la flor se vea plana.
  const backPetals: PetalSpec[] = [];
  for (let i = 0; i < petalCount; i++) {
    const len = baseLen * rng.range(1.08, 1.2);
    const width = baseWidth * rng.range(0.85, 0.98);
    const skew = rng.range(-len * 0.1, len * 0.1);
    backPetals.push({
      d: petalPath(len, width, skew),
      vein: petalVein(len, skew),
      angle: i * step + step / 2 + rng.range(-2.5, 2.5),
      delay: 180 + i * 7,
    });
  }

  const frontPetals: PetalSpec[] = [];
  for (let i = 0; i < petalCount; i++) {
    const len = baseLen * rng.range(0.9, 1.06);
    const width = baseWidth * rng.range(0.92, 1.1);
    const skew = rng.range(-len * 0.12, len * 0.12);
    frontPetals.push({
      d: petalPath(len, width, skew),
      vein: petalVein(len, skew),
      angle: i * step + rng.range(-3, 3),
      delay: 230 + i * 8,
    });
  }

  const bend = rng.range(-15, 15);
  const stem = stemPath(bend, rng.range(2.2, 3), rng.range(4.4, 5.6));

  const leafCount = rng.int(1, 2);
  const leaves: LeafSpec[] = [];
  for (let i = 0; i < leafCount; i++) {
    const flip = i === 0 ? rng.chance(0.5) : !leaves[0]!.flip;
    // Punto de inserción sobre el tallo, no sobre el eje vertical.
    const [ax, ay] = stemPointAt(bend, rng.range(0.38 + i * 0.26, 0.56 + i * 0.26));
    const len = rng.range(52, 72);
    const width = rng.range(17, 24);
    const curl = rng.range(-8, 8);
    const built = buildLeaf(ax, ay, len, width, curl);
    leaves.push({
      ...built,
      originX: ax,
      originY: ay,
      angle: (flip ? -1 : 1) * rng.range(52, 78),
      delay: 240 + i * 90,
      flip,
    });
  }

  return {
    palette,
    backPetals,
    frontPetals,
    stem,
    leaves,
    disc: {
      radius: discRadius,
      seeds: buildDiscSeeds(seedCount, discRadius, palette),
      crown: buildCrown(Math.round(discRadius * 1.6), discRadius),
    },
    bloomDuration: 780,
  };
}
