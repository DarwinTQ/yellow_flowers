'use client';

import { useEffect, useRef } from 'react';
import styles from './PetalRain.module.css';

/**
 * Lluvia de pétalos sobre `<canvas>`.
 *
 * Va en canvas y no en DOM por dos motivos: sostiene cientos de pétalos sin
 * crear un nodo por cada uno, y permite el giro sobre el eje vertical
 * (`scale(cos(t), 1)`), que es lo que hace que un pétalo se vea caer girando
 * en 3D en vez de solo rotar en el plano.
 */

/** Cuánto tiempo siguen apareciendo pétalos nuevos tras cada clic. */
const SPAWN_MS = 3200;
/** Pétalos por segundo. */
const RATE = 68;
const MAX_PETALS = 340;

/** Cara frontal y cara posterior (más apagada) de cada pétalo. */
const FRONTS = ['#FFD34E', '#F9C22E', '#FFE489', '#F0AE1B', '#FFC93F', '#FFDF6B'];
const BACKS = ['#DFA41C', '#D2970F', '#EFCB63', '#C2820B', '#DFA526', '#E7BC44'];

interface Petal {
  x: number;
  y: number;
  vy: number;
  drift: number;
  sway: number;
  swayFreq: number;
  phase: number;
  rot: number;
  vrot: number;
  flutter: number;
  flutterSpeed: number;
  w: number;
  h: number;
  front: string;
  back: string;
  alpha: number;
  t: number;
}

function tracePetal(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const hw = w / 2;
  const hh = h / 2;
  ctx.beginPath();
  ctx.moveTo(0, -hh);
  ctx.bezierCurveTo(hw * 1.15, -hh * 0.55, hw, hh * 0.62, 0, hh);
  ctx.bezierCurveTo(-hw, hh * 0.62, -hw * 1.15, -hh * 0.55, 0, -hh);
  ctx.closePath();
}

export interface PetalRainProps {
  /** Contador: cada incremento dispara (o prolonga) una lluvia. */
  burst: number;
}

export default function PetalRain({ burst }: PetalRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const triggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rate = reduced ? 16 : RATE;

    const petals: Petal[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let spawnUntil = 0;
    let accumulator = 0;
    let running = false;

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (): void => {
      if (petals.length >= MAX_PETALS) return;
      const tone = Math.floor(Math.random() * FRONTS.length);
      const w = 9 + Math.random() * 12;
      petals.push({
        x: Math.random() * (width + 120) - 60,
        y: -40 - Math.random() * 320,
        vy: reduced ? 70 + Math.random() * 60 : 120 + Math.random() * 210,
        drift: (Math.random() - 0.5) * 26,
        sway: 12 + Math.random() * 46,
        swayFreq: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        vrot: reduced ? 0 : (Math.random() - 0.5) * 3.4,
        flutter: Math.random() * Math.PI * 2,
        flutterSpeed: reduced ? 0 : 1.1 + Math.random() * 2.6,
        w,
        h: w * (1.5 + Math.random() * 0.8),
        front: FRONTS[tone]!,
        back: BACKS[tone]!,
        alpha: 0.72 + Math.random() * 0.28,
        t: 0,
      });
    };

    const frame = (ts: number): void => {
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 1 / 60;
      last = ts;
      clock += dt;

      if (ts < spawnUntil) {
        accumulator += dt * rate;
        while (accumulator >= 1) {
          spawn();
          accumulator -= 1;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Brisa global lenta: hace que toda la lluvia derive junta en vez de
      // que cada pétalo se mueva de forma independiente.
      const wind = Math.sin(clock * 0.42) * 24 + Math.sin(clock * 0.17) * 14;
      const limit = height + 80;

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i]!;
        p.t += dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        p.flutter += p.flutterSpeed * dt;

        const x = p.x + Math.sin(p.t * p.swayFreq * Math.PI * 2 + p.phase) * p.sway + (wind + p.drift) * p.t * 0.12;

        if (p.y > limit) {
          petals.splice(i, 1);
          continue;
        }

        // El giro sobre el eje: al pasar por el canto vemos el envés del pétalo.
        const turn = Math.cos(p.flutter);
        const squash = Math.max(Math.abs(turn), 0.09);

        ctx.save();
        ctx.translate(x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(squash, 1);
        ctx.globalAlpha = p.alpha;
        tracePetal(ctx, p.w, p.h);
        ctx.fillStyle = turn >= 0 ? p.front : p.back;
        ctx.fill();
        // Nervadura central: un hilo apenas visible que define la forma.
        ctx.globalAlpha = p.alpha * 0.28;
        ctx.beginPath();
        ctx.moveTo(0, -p.h * 0.42);
        ctx.lineTo(0, p.h * 0.42);
        ctx.strokeStyle = p.back;
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
      }

      if (petals.length > 0 || ts < spawnUntil) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        last = 0;
        ctx.clearRect(0, 0, width, height);
      }
    };

    const stop = (): void => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      last = 0;
      spawnUntil = 0;
      petals.length = 0;
      ctx.clearRect(0, 0, width, height);
    };

    const onVisibility = (): void => {
      if (document.hidden) stop();
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    triggerRef.current = () => {
      spawnUntil = performance.now() + SPAWN_MS;
      if (!running) {
        running = true;
        last = 0;
        accumulator = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    return () => {
      triggerRef.current = null;
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (burst > 0) triggerRef.current?.();
  }, [burst]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
