/**
 * PRNG determinista (mulberry32).
 *
 * Toda la aleatoriedad visual pasa por aquí: un mismo `seed` produce siempre
 * la misma flor. Eso mantiene el render del servidor y el del cliente
 * idénticos (sin errores de hidratación) y hace que cada flor sea reproducible.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  /** Flotante en [0, 1). */
  next(): number;
  /** Flotante en [min, max). */
  range(min: number, max: number): number;
  /** Entero en [min, max]. */
  int(min: number, max: number): number;
  /** Elemento al azar del array. */
  pick<T>(items: readonly T[]): T;
  /** `true` con la probabilidad indicada. */
  chance(probability: number): boolean;
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  const range = (min: number, max: number) => min + next() * (max - min);
  return {
    next,
    range,
    int: (min, max) => Math.floor(range(min, max + 1)),
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!,
    chance: (probability: number) => next() < probability,
  };
}

/**
 * Redondeo numérico a 3 decimales.
 *
 * Imprescindible para cualquier número que acabe como atributo del SVG: las
 * funciones trascendentales (`Math.sin`, `Math.cos`, `Math.sqrt`) no garantizan
 * el mismo último bit entre el V8 de Node y el del navegador, así que un valor
 * crudo como `77.21677102185117` puede llegar al cliente como `...119` y React
 * lo reporta como error de hidratación. Redondeado, servidor y cliente
 * coinciden siempre.
 */
export function r(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Redondeo corto para que los `path` del SVG no arrastren ruido decimal. */
export function n(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

/** Interpolación lineal entre dos colores hexadecimales (`#rrggbb`). */
export function mixHex(from: string, to: string, t: number): string {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const k = Math.min(1, Math.max(0, t));
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * k);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}
