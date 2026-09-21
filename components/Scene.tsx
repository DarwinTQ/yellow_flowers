'use client';

import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Flower from './Flower';
import PetalRain from './PetalRain';
import { PALETTES } from '@/lib/flower';
import { createRng, type Rng } from '@/lib/random';
import { createPlantedFlower, type PlantedFlower } from '@/lib/placement';
import styles from './Scene.module.css';

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Tope de flores vivas. Se acumulan libremente hasta este número; a partir de
 * ahí la más antigua cede el lugar, para que el jardín no crezca sin control.
 */
const MAX_PLANTED = 80;

/** Flores decorativas, fuera de foco, que enmarcan el contenido. */
const AMBIENT = [
  {
    uid: 'amb-a',
    seed: 90210,
    palette: PALETTES[0]!,
    style: { left: '-14vmin', top: '-30vmin', width: '54vmin' },
    rotate: '206deg',
    blur: '2.5px',
    opacity: 0.32,
    duration: '17s',
    delay: '0s',
  },
  {
    uid: 'amb-b',
    seed: 31415,
    palette: PALETTES[2]!,
    style: { right: '-20vmin', bottom: '-34vmin', width: '66vmin' },
    rotate: '14deg',
    blur: '3.5px',
    opacity: 0.26,
    duration: '21s',
    delay: '-4s',
  },
  {
    uid: 'amb-c',
    seed: 77104,
    palette: PALETTES[1]!,
    style: { right: '6vmin', top: '-26vmin', width: '30vmin' },
    rotate: '168deg',
    blur: '1.5px',
    opacity: 0.22,
    duration: '13s',
    delay: '-7s',
  },
] as const;

export interface SceneProps {
  /** Copia estática renderizada en el servidor (React Server Component). */
  children: ReactNode;
}

export default function Scene({ children }: SceneProps) {
  const [flowers, setFlowers] = useState<PlantedFlower[]>([]);
  const [burst, setBurst] = useState(0);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(0);
  const rngRef = useRef<Rng | null>(null);

  const plant = useCallback(() => {
    // El generador se crea en el primer clic: así nada aleatorio corre durante
    // el render y el HTML del servidor coincide exacto con el del cliente.
    if (!rngRef.current) {
      rngRef.current = createRng(Date.now() & 0x7fffffff);
    }
    const rng = rngRef.current;

    const rect = contentRef.current?.getBoundingClientRect() ?? null;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const flower = createPlantedFlower(nextId.current++, rng, rect, viewport);

    setFlowers((current) => {
      const next = [...current, flower];
      return next.length > MAX_PLANTED ? next.slice(next.length - MAX_PLANTED) : next;
    });
  }, []);

  const celebrate = useCallback(() => {
    setBurst((b) => b + 1);
  }, []);

  const clear = useCallback(() => {
    setFlowers([]);
  }, []);

  const ambient = useMemo(
    () =>
      AMBIENT.map((a) => (
        <div
          key={a.uid}
          className={styles.ambient}
          style={
            {
              ...a.style,
              '--r': a.rotate,
              '--dur': a.duration,
              '--delay': a.delay,
              filter: `blur(${a.blur})`,
              opacity: a.opacity,
            } as CssVars
          }
        >
          <Flower seed={a.seed} uid={a.uid} palette={a.palette} detail="high" discSeeds={160} />
        </div>
      )),
    [],
  );

  return (
    <div className={styles.scene}>
      <div className={styles.horizon} aria-hidden="true" />
      <div className={styles.ambientLayer} aria-hidden="true">
        {ambient}
      </div>

      <div className={styles.garden} aria-hidden="true">
        {flowers.map((f) => (
          <div
            key={f.id}
            className={styles.plant}
            style={
              {
                left: `${f.xPct}%`,
                bottom: `${f.bottomPct}%`,
                width: `${f.width}px`,
                marginLeft: `${-f.width / 2}px`,
                zIndex: f.z,
                '--dur': `${f.swayDuration}s`,
                '--delay': `${f.swayDelay}s`,
                '--amt': `${f.swayAmount}deg`,
              } as CssVars
            }
          >
            {/* El detalle sigue al tamaño en pantalla: con 80 flores vivas, las
                nervaduras y las 150 semillas de una flor chica son nodos que
                nadie llega a ver. */}
            <Flower
              seed={f.seed}
              uid={`p${f.id}`}
              bloom
              detail={f.width > 104 ? 'high' : 'low'}
              discSeeds={f.width > 104 ? 96 : 36}
            />
          </div>
        ))}
      </div>

      <div className={styles.content} ref={contentRef}>
        {children}

        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={plant}>
            <SproutIcon />
            Plantar una flor
          </button>
          <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={celebrate}>
            <SparkIcon />
            Celebrar
          </button>
        </div>

        <p
          className={`${styles.meta} ${flowers.length > 0 ? styles.metaVisible : ''}`}
          aria-live="polite"
        >
          {flowers.length > 0 && (
            <>
              <span className={styles.count}>
                {flowers.length} {flowers.length === 1 ? 'flor' : 'flores'} en el jardín
              </span>
              <button type="button" className={styles.clear} onClick={clear}>
                vaciar
              </button>
            </>
          )}
        </p>
      </div>

      <PetalRain burst={burst} />

      {/* Firma: fuera de `.content` para no entrar en el rect que decide dónde
          se plantan las flores, y por encima de la lluvia de pétalos. */}
      <a
        className={styles.credit}
        href="https://github.com/DarwinTQ"
        target="_blank"
        rel="noopener noreferrer"
      >
        By Darwinn :)
      </a>
    </div>
  );
}

function SproutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" />
      <path d="M12 13c0-3.9 3.1-7 7-7 0 3.9-3.1 7-7 7Z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
      <path d="M12 3.5 13.9 9 19.5 10.9 13.9 12.8 12 18.3 10.1 12.8 4.5 10.9 10.1 9Z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" />
    </svg>
  );
}
