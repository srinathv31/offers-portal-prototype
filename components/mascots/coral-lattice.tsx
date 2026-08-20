"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { MascotProps, MascotState } from "./types";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Lattice — "The Constellation"
 *
 * Intelligence as orchestration: a sphere of data points wired into a
 * living network. The lattice visibly computes — synapse pulses travel
 * random walks across the graph, the whole structure contracts to listen,
 * churns while thinking, and radiates banded waves while speaking.
 */

interface StateParams {
  rotSpeed: number;
  radiusScale: number;
  deform: number;
  bandAmp: number;
  flashInterval: number; // seconds between synapse pulses (0 = none)
  gold: number;
}

const STATE_PARAMS: Record<MascotState, StateParams> = {
  idle: {
    rotSpeed: 0.18,
    radiusScale: 1,
    deform: 0.02,
    bandAmp: 0,
    flashInterval: 2.6,
    gold: 0,
  },
  listening: {
    rotSpeed: 0.06,
    radiusScale: 0.86,
    deform: 0.012,
    bandAmp: 0,
    flashInterval: 0,
    gold: 0,
  },
  thinking: {
    rotSpeed: 0.55,
    radiusScale: 1.02,
    deform: 0.16,
    bandAmp: 0,
    flashInterval: 0.28,
    gold: 0,
  },
  speaking: {
    rotSpeed: 0.22,
    radiusScale: 1,
    deform: 0.03,
    bandAmp: 0.75,
    flashInterval: 1.4,
    gold: 0,
  },
  celebrating: {
    rotSpeed: 0.35,
    radiusScale: 1.08,
    deform: 0.05,
    bandAmp: 0.2,
    flashInterval: 0.5,
    gold: 1,
  },
};

interface Pulse {
  path: number[]; // node indices of a random walk
  t0: number;
}

interface Ring {
  r: number;
  alpha: number;
}

function smooth(current: number, target: number, dt: number, rate: number) {
  return current + (target - current) * (1 - Math.exp(-dt * rate));
}

export function CoralLattice({
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
    const FOCAL = R * 3.2;

    // Fibonacci sphere — node count adapts to render size so avatar-scale
    // instances read as a small constellation instead of a blur
    const N = Math.round(Math.min(380, Math.max(44, size * 1.2)));
    const sizeFactor = Math.max(0.5, Math.min(1, size / 320));
    const base: [number, number, number][] = [];
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = GOLDEN * i;
      base.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
    }

    // Wire each node to its 3 nearest neighbors (deduped)
    const edgeSet = new Set<string>();
    const neighbors: number[][] = Array.from({ length: N }, () => []);
    for (let i = 0; i < N; i++) {
      const dists: [number, number][] = [];
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const dx = base[i][0] - base[j][0];
        const dy = base[i][1] - base[j][1];
        const dz = base[i][2] - base[j][2];
        dists.push([dx * dx + dy * dy + dz * dz, j]);
      }
      dists.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < 3; k++) {
        const j = dists[k][1];
        edgeSet.add(`${Math.min(i, j)}-${Math.max(i, j)}`);
      }
    }
    const edges: [number, number][] = [];
    for (const key of edgeSet) {
      const [a, b] = key.split("-").map(Number);
      edges.push([a, b]);
      neighbors[a].push(b);
      neighbors[b].push(a);
    }

    const pulses: Pulse[] = [];
    const rings: Ring[] = [];
    const nodeGlow = new Float32Array(N);

    const p = { ...STATE_PARAMS.idle };
    let radiusScale = 1;
    let radiusVelocity = 0;
    let rotY = 0.6;
    let lastState: MascotState = stateRef.current;
    let flashClock = 0;
    let ringClock = 0;
    let t = 0;
    let lastTime = performance.now();
    let raf = 0;

    const projected = new Float32Array(N * 4); // x, y, depthScale, brightness

    const spawnPulse = (time: number) => {
      const start = Math.floor(Math.random() * N);
      const path = [start];
      let current = start;
      for (let step = 0; step < 5; step++) {
        const options = neighbors[current];
        if (options.length === 0) break;
        const next = options[Math.floor(Math.random() * options.length)];
        if (path.includes(next)) break;
        path.push(next);
        current = next;
      }
      if (path.length > 1) pulses.push({ path, t0: time });
    };

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      t += dt;

      const currentState = stateRef.current;
      const target = STATE_PARAMS[currentState];
      if (currentState !== lastState) {
        if (currentState === "celebrating") {
          radiusVelocity += 2.6;
          for (let i = 0; i < 4; i++) spawnPulse(t + i * 0.1);
        }
        lastState = currentState;
      }

      p.rotSpeed = smooth(p.rotSpeed, target.rotSpeed, dt, 2.5);
      p.deform = smooth(p.deform, target.deform, dt, 3);
      p.bandAmp = smooth(p.bandAmp, target.bandAmp, dt, 4);
      p.gold = smooth(p.gold, target.gold, dt, 3);

      // Springy radius keeps state changes feeling physical
      const springK = 50;
      const springD = 7;
      radiusVelocity += (target.radiusScale - radiusScale) * springK * dt;
      radiusVelocity *= Math.exp(-springD * dt);
      radiusScale += radiusVelocity * dt;

      rotY += dt * p.rotSpeed;
      const rotX = 0.35 + 0.08 * Math.sin(t * 0.4);

      // Synapse pulses
      if (target.flashInterval > 0) {
        flashClock += dt;
        if (flashClock >= target.flashInterval) {
          flashClock = 0;
          spawnPulse(t);
        }
      }

      // Listening: rings breathe inward toward the contracted sphere
      if (currentState === "listening") {
        ringClock += dt;
        if (ringClock > 0.9) {
          ringClock = 0;
          rings.push({ r: 1.7, alpha: 0.5 });
        }
      }

      for (let i = 0; i < N; i++) nodeGlow[i] = Math.max(0, nodeGlow[i] - dt * 2.2);
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        const age = t - pulse.t0;
        if (age > pulse.path.length * 0.09 + 0.5) {
          pulses.splice(i, 1);
          continue;
        }
        pulse.path.forEach((node, k) => {
          const local = age - k * 0.09;
          if (local > 0 && local < 0.45) {
            nodeGlow[node] = Math.max(nodeGlow[node], 1 - local / 0.45);
          }
        });
      }

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      for (let i = 0; i < N; i++) {
        const [bx, by, bz] = base[i];
        // Per-node organic displacement
        const noise =
          Math.sin(i * 12.9898 + t * 2.3) * Math.sin(i * 78.233 + t * 1.7);
        const r = R * radiusScale * (1 + p.deform * noise + 0.015 * Math.sin(t * 1.2 + i));

        let x = bx * r;
        const y0 = by * r;
        const z = bz * r;

        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y0 * cosX - z1 * sinX;
        const z2 = y0 * sinX + z1 * cosX;

        const persp = FOCAL / (FOCAL + z2);
        x = cx + x1 * persp;
        const y = cy + y1 * persp;

        // Speaking: latitude bands sweep across the sphere
        const band =
          p.bandAmp > 0.01
            ? p.bandAmp * Math.max(0, Math.sin(Math.asin(by) * 5 - t * 6))
            : 0;

        const depth = (R * radiusScale - z2) / (2 * R * radiusScale); // 0 back → 1 front
        projected[i * 4] = x;
        projected[i * 4 + 1] = y;
        projected[i * 4 + 2] = persp;
        projected[i * 4 + 3] = Math.min(
          1.6,
          0.25 + depth * 0.75 + band + nodeGlow[i] * 1.1
        );
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Core ambient glow
      const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.8);
      aura.addColorStop(0, "hsla(350, 90%, 60%, 0.16)");
      aura.addColorStop(0.6, "hsla(280, 80%, 55%, 0.07)");
      aura.addColorStop(1, "hsla(280, 80%, 55%, 0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, size, size);

      ctx.globalCompositeOperation = "lighter";

      // Listening rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.r -= dt * 0.5;
        ring.alpha -= dt * 0.35;
        if (ring.alpha <= 0 || ring.r <= 0.95) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, R * radiusScale * ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(186, 90%, 70%, ${ring.alpha * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Nodes shade rose → violet by latitude; everything golds while celebrating.
      // Gold lerps via hue 406 (≡46) so the blend passes through warm reds, not green.
      const stateHue = (baseHue: number) =>
        (baseHue + (406 - baseHue) * p.gold) % 360;

      // Edges
      ctx.lineWidth = 0.7 * Math.max(sizeFactor, 0.8);
      for (const [a, b] of edges) {
        const brightness =
          (projected[a * 4 + 3] + projected[b * 4 + 3]) / 2;
        const glow = Math.max(nodeGlow[a], nodeGlow[b]);
        const alpha = 0.08 + brightness * 0.16 + glow * 0.5;
        const hue = stateHue(350 - (base[a][1] + 1) * 45);
        ctx.strokeStyle =
          glow > 0.05
            ? `hsla(46, 100%, ${70 + glow * 20}%, ${alpha})`
            : `hsla(${hue}, 85%, 68%, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(projected[a * 4], projected[a * 4 + 1]);
        ctx.lineTo(projected[b * 4], projected[b * 4 + 1]);
        ctx.stroke();
      }

      // Nodes
      for (let i = 0; i < N; i++) {
        const x = projected[i * 4];
        const y = projected[i * 4 + 1];
        const persp = projected[i * 4 + 2];
        const brightness = projected[i * 4 + 3];
        const glow = nodeGlow[i];
        const hue = stateHue(350 - (base[i][1] + 1) * 45);
        const radius = (0.9 + persp * 1.1) * sizeFactor * (1 + glow * 1.4);

        if (glow > 0.03 || brightness > 0.85) {
          ctx.beginPath();
          ctx.arc(x, y, radius * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 100%, 75%, ${0.09 + glow * 0.25})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${85 + glow * 15}%, ${62 + brightness * 22}%, ${Math.min(1, 0.35 + brightness * 0.55)})`;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      if (!reducedMotion) raf = requestAnimationFrame(frame);
    };

    if (reducedMotion) {
      t = 1;
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
      aria-label="Coral Intelligence mascot — Lattice"
      className={cn("select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
