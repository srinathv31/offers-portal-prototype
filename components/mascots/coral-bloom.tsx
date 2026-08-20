"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { MascotProps, MascotState } from "./types";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Bloom — "The Organism"
 *
 * A living, breathing coral polyp rendered generatively on canvas.
 * The body is a soft-harmonic blob that breathes; bioluminescent motes
 * drift through it and a warm nucleus swims inside. States are expressed
 * through motion energy and an accent color at the rim — the coral body
 * itself never leaves brand color.
 */

interface StateParams {
  speed: number;
  wobble: number;
  scale: number;
  accentHue: number;
  accentSat: number;
  nucleusViolet: number; // 0..1, shifts nucleus toward violet while thinking
  moteSpeed: number;
  ringDir: number; // 1 outward, -1 inward, 0 none
  ringRate: number; // rings per second
}

const STATE_PARAMS: Record<MascotState, StateParams> = {
  idle: {
    speed: 0.55,
    wobble: 0.5,
    scale: 1,
    accentHue: 24,
    accentSat: 95,
    nucleusViolet: 0,
    moteSpeed: 0.5,
    ringDir: 0,
    ringRate: 0,
  },
  listening: {
    speed: 0.45,
    wobble: 0.32,
    scale: 0.96,
    accentHue: 186,
    accentSat: 90,
    nucleusViolet: 0.15,
    moteSpeed: 0.3,
    ringDir: -1,
    ringRate: 1.1,
  },
  thinking: {
    speed: 1.7,
    wobble: 1.05,
    scale: 1.01,
    accentHue: 268,
    accentSat: 88,
    nucleusViolet: 1,
    moteSpeed: 2.4,
    ringDir: 0,
    ringRate: 0,
  },
  speaking: {
    speed: 0.9,
    wobble: 0.62,
    scale: 1.02,
    accentHue: 32,
    accentSat: 100,
    nucleusViolet: 0,
    moteSpeed: 1.1,
    ringDir: 1,
    ringRate: 1.6,
  },
  celebrating: {
    speed: 1.25,
    wobble: 0.85,
    scale: 1.06,
    accentHue: 46,
    accentSat: 100,
    nucleusViolet: 0,
    moteSpeed: 1.8,
    ringDir: 1,
    ringRate: 2.2,
  },
};

interface Mote {
  angle: number;
  orbit: number; // fraction of body radius
  speed: number;
  size: number;
  phase: number;
}

interface Ring {
  r: number; // fraction of body radius
  dir: number;
  alpha: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number;
}

function smooth(current: number, target: number, dt: number, rate: number) {
  return current + (target - current) * (1 - Math.exp(-dt * rate));
}

export function CoralBloom({
  state = "idle",
  size = 320,
  className,
}: MascotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MascotState>(state);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.3;

    const motes: Mote[] = Array.from({ length: 22 }, (_, i) => ({
      angle: (i / 22) * Math.PI * 2 + Math.sin(i * 7.3) * 2,
      orbit: 0.18 + ((i * 37) % 100) / 100 * 0.52,
      speed: 0.25 + ((i * 53) % 100) / 100 * 0.7,
      size: 1 + ((i * 29) % 100) / 100 * 1.6,
      phase: i * 1.7,
    }));

    const rings: Ring[] = [];
    const sparks: Spark[] = [];

    // Live params, smoothed toward the active state's targets each frame
    const p = { ...STATE_PARAMS.idle };
    let breatheScale = 1;
    let scaleVelocity = 0;
    let lastState: MascotState = stateRef.current;
    let ringAccumulator = 0;
    let t = 0;
    let lastTime = performance.now();
    let raf = 0;

    const blobRadius = (theta: number, time: number, wobble: number) => {
      const w = wobble * 0.045;
      return (
        1 +
        w * 1.0 * Math.sin(3 * theta + time * 0.9) +
        w * 0.7 * Math.sin(5 * theta - time * 1.3 + 1.7) +
        w * 0.45 * Math.sin(7 * theta + time * 1.7 + 4.1)
      );
    };

    const traceBlob = (radius: number, time: number, wobble: number) => {
      const STEPS = 96;
      const pts: [number, number][] = [];
      for (let i = 0; i < STEPS; i++) {
        const theta = (i / STEPS) * Math.PI * 2;
        const r = radius * blobRadius(theta, time, wobble);
        pts.push([cx + Math.cos(theta) * r, cy + Math.sin(theta) * r]);
      }
      ctx.beginPath();
      const mid = (a: [number, number], b: [number, number]) =>
        [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as [number, number];
      let m = mid(pts[STEPS - 1], pts[0]);
      ctx.moveTo(m[0], m[1]);
      for (let i = 0; i < STEPS; i++) {
        const next = pts[(i + 1) % STEPS];
        m = mid(pts[i], next);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      ctx.closePath();
    };

    const spawnBurst = () => {
      for (let i = 0; i < 42; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = R * (1.2 + Math.random() * 2.4);
        sparks.push({
          x: cx + Math.cos(angle) * R * 0.6,
          y: cy + Math.sin(angle) * R * 0.6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - R * 0.6,
          life: 1,
          hue: 20 + Math.random() * 40,
        });
      }
      scaleVelocity += 1.4;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const currentState = stateRef.current;
      const target = STATE_PARAMS[currentState];
      if (currentState !== lastState) {
        if (currentState === "celebrating") spawnBurst();
        lastState = currentState;
      }

      p.speed = smooth(p.speed, target.speed, dt, 3);
      p.wobble = smooth(p.wobble, target.wobble, dt, 3);
      p.accentHue = smooth(p.accentHue, target.accentHue, dt, 4);
      p.accentSat = smooth(p.accentSat, target.accentSat, dt, 4);
      p.nucleusViolet = smooth(p.nucleusViolet, target.nucleusViolet, dt, 3);
      p.moteSpeed = smooth(p.moteSpeed, target.moteSpeed, dt, 3);

      t += dt * p.speed;

      // Voice envelope gives speaking its cadence
      const env =
        currentState === "speaking"
          ? Math.max(0, Math.sin(t * 9.1) * Math.sin(t * 3.7)) *
            Math.max(0, Math.sin(t * 1.9) + 0.4)
          : 0;

      // Breathing + spring toward state scale
      const breathTarget =
        target.scale * (1 + 0.018 * Math.sin(t * 1.1) + 0.05 * env);
      const springK = 60;
      const springD = 8;
      scaleVelocity += (breathTarget - breatheScale) * springK * dt;
      scaleVelocity *= Math.exp(-springD * dt);
      breatheScale += scaleVelocity * dt;

      const bodyR = R * breatheScale;
      const accent = (l: number, a: number) =>
        `hsla(${p.accentHue}, ${p.accentSat}%, ${l}%, ${a})`;

      // Ring emission
      ringAccumulator += dt * target.ringRate;
      while (ringAccumulator >= 1) {
        ringAccumulator -= 1;
        rings.push({
          r: target.ringDir > 0 ? 1.02 : 1.65,
          dir: target.ringDir,
          alpha: 0.55,
        });
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Ambient aura
      const aura = ctx.createRadialGradient(cx, cy, bodyR * 0.2, cx, cy, bodyR * 1.7);
      aura.addColorStop(0, `hsla(10, 90%, 62%, 0.28)`);
      aura.addColorStop(0.65, accent(60, 0.1));
      aura.addColorStop(1, "hsla(10, 90%, 60%, 0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, size, size);

      // Rings (listening pulls inward, speaking radiates outward)
      ctx.globalCompositeOperation = "lighter";
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.r += ring.dir * dt * 0.55;
        ring.alpha -= dt * (ring.dir > 0 ? 0.5 : 0.42);
        if (ring.alpha <= 0 || ring.r <= 0.7 || ring.r >= 2.1) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, bodyR * ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = accent(70, ring.alpha * 0.8);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";

      // Body
      traceBlob(bodyR, t, p.wobble);
      const body = ctx.createLinearGradient(
        cx - bodyR,
        cy - bodyR,
        cx + bodyR * 0.6,
        cy + bodyR
      );
      body.addColorStop(0, "hsl(28, 100%, 66%)");
      body.addColorStop(0.5, "hsl(8, 92%, 62%)");
      body.addColorStop(1, "hsl(334, 76%, 52%)");
      ctx.fillStyle = body;
      ctx.fill();

      // Accent rim
      ctx.strokeStyle = accent(75, 0.55);
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Interior — nucleus and motes are clipped to the body
      ctx.save();
      ctx.clip();
      ctx.globalCompositeOperation = "lighter";

      // Swimming nucleus
      const nx = cx + bodyR * 0.2 * Math.sin(t * 0.7);
      const ny = cy + bodyR * 0.16 * Math.cos(t * 0.9) - bodyR * 0.1;
      const nucleusR = bodyR * (0.52 + 0.05 * Math.sin(t * 1.4));
      const nucleus = ctx.createRadialGradient(nx, ny, 0, nx, ny, nucleusR);
      const nvHue = 40 + p.nucleusViolet * 228; // 40 (warm) → 268 (violet) while thinking
      nucleus.addColorStop(0, `hsla(${nvHue}, 100%, 78%, ${0.5 + p.nucleusViolet * 0.15})`);
      nucleus.addColorStop(1, `hsla(${nvHue}, 100%, 70%, 0)`);
      ctx.fillStyle = nucleus;
      ctx.beginPath();
      ctx.arc(nx, ny, nucleusR, 0, Math.PI * 2);
      ctx.fill();

      // Bioluminescent motes
      for (const mote of motes) {
        mote.angle += dt * mote.speed * p.moteSpeed;
        const wobbleR =
          mote.orbit + 0.04 * Math.sin(t * 1.3 + mote.phase);
        const mx = cx + Math.cos(mote.angle + mote.phase) * bodyR * wobbleR;
        const my = cy + Math.sin(mote.angle * 0.9 + mote.phase) * bodyR * wobbleR;
        const twinkle = 0.45 + 0.55 * Math.sin(t * 2 + mote.phase * 3) ** 2;
        ctx.beginPath();
        ctx.arc(mx, my, mote.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(40, 100%, 85%, ${0.06 * twinkle})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx, my, mote.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(45, 100%, 90%, ${0.5 * twinkle})`;
        ctx.fill();
      }

      // Top-left specular sheen
      const sheen = ctx.createRadialGradient(
        cx - bodyR * 0.4,
        cy - bodyR * 0.5,
        0,
        cx - bodyR * 0.4,
        cy - bodyR * 0.5,
        bodyR * 0.9
      );
      sheen.addColorStop(0, "hsla(30, 100%, 90%, 0.32)");
      sheen.addColorStop(1, "hsla(30, 100%, 90%, 0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(cx - bodyR * 1.4, cy - bodyR * 1.5, bodyR * 2, bodyR * 2);

      ctx.restore();

      // Celebration sparks
      if (sparks.length > 0) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = sparks.length - 1; i >= 0; i--) {
          const spark = sparks[i];
          spark.x += spark.vx * dt;
          spark.y += spark.vy * dt;
          spark.vy += R * 2.2 * dt;
          spark.vx *= Math.exp(-1.4 * dt);
          spark.life -= dt * 1.1;
          if (spark.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, 1.2 + spark.life * 1.6, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${spark.hue}, 100%, ${60 + spark.life * 25}%, ${spark.life})`;
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      if (!reducedMotion) raf = requestAnimationFrame(frame);
    };

    if (reducedMotion) {
      t = 2;
      frame(lastTime + 16);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => cancelAnimationFrame(raf);
  }, [size, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Coral Intelligence mascot — Bloom"
      className={cn("select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
