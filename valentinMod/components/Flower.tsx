import { memo, type CSSProperties } from 'react';
import {
  buildFlower,
  HEAD_X,
  HEAD_Y,
  VIEW_BOX,
  type FlowerPalette,
} from '@/lib/flower';
import { mixHex } from '@/lib/random';
import styles from './Flower.module.css';

/** Las custom properties no están en `CSSProperties`, así que se amplía el tipo. */
type CssVars = CSSProperties & Record<`--${string}`, string | number>;

export interface FlowerProps {
  /** Semilla determinista: la misma semilla dibuja siempre la misma flor. */
  seed: number;
  /** Prefijo para los `id` de los degradados (los ids de SVG son globales). */
  uid: string;
  /** Si es `true`, la flor florece al montarse. */
  bloom?: boolean;
  /** `low` recorta nervaduras y semillas: para flores chicas no se notan y aligeran el DOM. */
  detail?: 'high' | 'low';
  /** Semillas del disco. Por defecto se deduce de `detail`. */
  discSeeds?: number;
  palette?: FlowerPalette;
  className?: string;
  style?: CSSProperties;
}

/** Alcance máximo de un pétalo, usado para orientar el degradado base -> punta. */
const PETAL_REACH = 90;

function FlowerComponent({
  seed,
  uid,
  bloom = false,
  detail = 'high',
  discSeeds,
  palette,
  className,
  style,
}: FlowerProps) {
  const high = detail === 'high';
  const model = buildFlower(seed, {
    palette,
    discSeeds: discSeeds ?? (high ? 150 : 44),
  });
  const p = model.palette;
  const r = model.disc.radius;

  const id = (name: string) => `${uid}-${name}`;
  const ref = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox={VIEW_BOX}
      className={[styles.svg, bloom ? styles.bloom : '', className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Pétalos: ámbar profundo en la base, amarillo luminoso en la punta. */}
        <linearGradient
          id={id('front')}
          gradientUnits="userSpaceOnUse"
          x1={HEAD_X}
          y1={HEAD_Y}
          x2={HEAD_X}
          y2={HEAD_Y - PETAL_REACH}
        >
          <stop offset="0%" stopColor={p.petalBase} />
          <stop offset="38%" stopColor={p.petalMid} />
          <stop offset="100%" stopColor={p.petalTip} />
        </linearGradient>

        <linearGradient
          id={id('back')}
          gradientUnits="userSpaceOnUse"
          x1={HEAD_X}
          y1={HEAD_Y}
          x2={HEAD_X}
          y2={HEAD_Y - PETAL_REACH}
        >
          <stop offset="0%" stopColor={p.petalBack} />
          <stop offset="100%" stopColor={p.petalBackTip} />
        </linearGradient>

        {/* Disco central: oscuro al centro, cálido hacia el borde. */}
        <radialGradient
          id={id('disc')}
          gradientUnits="userSpaceOnUse"
          cx={HEAD_X}
          cy={HEAD_Y}
          r={r}
        >
          <stop offset="0%" stopColor={p.discInner} />
          <stop offset="62%" stopColor={mixHex(p.discInner, p.discOuter, 0.7)} />
          <stop offset="100%" stopColor={p.discOuter} />
        </radialGradient>

        {/* Luz especular desplazada arriba-izquierda: da volumen esférico al disco. */}
        <radialGradient
          id={id('gloss')}
          gradientUnits="userSpaceOnUse"
          cx={HEAD_X - r * 0.36}
          cy={HEAD_Y - r * 0.42}
          r={r * 1.15}
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={id('stem')} gradientUnits="userSpaceOnUse" x1={HEAD_X - 6} y1={0} x2={HEAD_X + 6} y2={0}>
          <stop offset="0%" stopColor={p.stemDark} />
          <stop offset="45%" stopColor={p.stem} />
          <stop offset="100%" stopColor={p.stemDark} />
        </linearGradient>

        <linearGradient id={id('leaf')} gradientUnits="userSpaceOnUse" x1={HEAD_X - 22} y1={0} x2={HEAD_X + 22} y2={0}>
          <stop offset="0%" stopColor={p.leaf} />
          <stop offset="100%" stopColor={p.leafDark} />
        </linearGradient>
      </defs>

      <path className={styles.stem} d={model.stem} fill={ref('stem')} />

      {model.leaves.map((leaf, i) => (
        <g
          key={i}
          className={styles.leaf}
          style={
            {
              '--a': `${leaf.angle}deg`,
              '--d': `${leaf.delay}ms`,
              '--ox': `${leaf.originX}px`,
              '--oy': `${leaf.originY}px`,
            } as CssVars
          }
        >
          <path d={leaf.d} fill={ref('leaf')} />
          <path d={leaf.midrib} fill="none" stroke={p.leafDark} strokeWidth={1.1} strokeOpacity={0.55} />
          {high &&
            leaf.veins.map((vein, k) => (
              <path key={k} d={vein} fill="none" stroke={p.leafDark} strokeWidth={0.6} strokeOpacity={0.35} />
            ))}
        </g>
      ))}

      {/* Corona trasera: más larga y oscura, desfasada medio paso -> da volumen. */}
      {model.backPetals.map((petal, i) => (
        <g
          key={`b${i}`}
          className={styles.petal}
          style={{ '--a': `${petal.angle}deg`, '--d': `${petal.delay}ms` } as CssVars}
        >
          <path d={petal.d} fill={ref('back')} />
        </g>
      ))}

      {model.frontPetals.map((petal, i) => (
        <g
          key={`f${i}`}
          className={styles.petal}
          style={{ '--a': `${petal.angle}deg`, '--d': `${petal.delay}ms` } as CssVars}
        >
          <path d={petal.d} fill={ref('front')} stroke={p.petalBase} strokeWidth={0.5} strokeOpacity={0.25} />
          {high && <path d={petal.vein} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.3} />}
        </g>
      ))}

      <g className={styles.disc}>
        <circle cx={HEAD_X} cy={HEAD_Y} r={r} fill={ref('disc')} />
        {/* Flósculos del borde. */}
        <path d={model.disc.crown} fill={p.crown} fillOpacity={0.85} />
        {/* Semillas en espiral de Fermat (ángulo áureo): la textura real del girasol. */}
        {model.disc.seeds.map((s, i) => (
          <ellipse
            key={i}
            cx={s.cx}
            cy={s.cy}
            rx={s.rx}
            ry={s.ry}
            fill={s.fill}
            fillOpacity={s.opacity}
            transform={`rotate(${s.angle} ${s.cx} ${s.cy})`}
          />
        ))}
        <circle cx={HEAD_X} cy={HEAD_Y} r={r} fill={ref('gloss')} />
        <circle
          cx={HEAD_X}
          cy={HEAD_Y}
          r={r}
          fill="none"
          stroke={p.discInner}
          strokeWidth={0.8}
          strokeOpacity={0.35}
        />
      </g>
    </svg>
  );
}

export const Flower = memo(FlowerComponent);
export default Flower;
