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
 * random walks across the graph, the structure contracts to listen,
 * churns while thinking, and radiates banded waves while speaking.
 *
 * It is also tactile: drag to spin it (with inertia), and hovering makes
 * nearby nodes lean toward the cursor and light up. On celebration the
 * whole constellation gathers into a golden checkmark, holds, and springs
 * back into a sphere. Error fractures the network with red flicker;
 * sleeping dims it to a slow, dreaming rotation.
 */

interface StateParams {
  rotSpeed: number;
  radiusScale: number;
  deform: number;
  bandAmp: number;
  flashInterval: number; // seconds between synapse pulses (0 = none)
  gold: number;
  alert: number; // 0..1 red-alert tint + fracture flicker
  dim: number; // 0..1 global dimming (sleep)
}

const STATE_PARAMS: Record<MascotState, StateParams> = {
  idle: {
    rotSpeed: 0.18,
    radiusScale: 1,
    deform: 0.02,
    bandAmp: 0,
    flashInterval: 2.6,
    gold: 0,
    alert: 0,
    dim: 0,
  },
  listening: {
    rotSpeed: 0.06,
    radiusScale: 0.86,
    deform: 0.012,
    bandAmp: 0,
    flashInterval: 0,
    gold: 0,
    alert: 0,
    dim: 0,
  },
  thinking: {
    rotSpeed: 0.55,
    radiusScale: 1.02,
    deform: 0.16,
    bandAmp: 0,
    flashInterval: 0.28,
    gold: 0,
    alert: 0,
    dim: 0,
  },
  speaking: {
    rotSpeed: 0.22,
    radiusScale: 1,
    deform: 0.03,
    bandAmp: 0.75,
    flashInterval: 1.4,
    gold: 0,
    alert: 0,
    dim: 0,
  },
  celebrating: {
    rotSpeed: 0.35,
    radiusScale: 1.06,
    deform: 0.05,
    bandAmp: 0.2,
    flashInterval: 0.5,
    gold: 1,
    alert: 0,
    dim: 0,
  },
  error: {
    rotSpeed: 0.08,
    radiusScale: 0.98,
    deform: 0.045,
    bandAmp: 0,
    flashInterval: 0,
    gold: 0,
    alert: 1,
    dim: 0,
  },
  sleeping: {
    rotSpeed: 0.045,
    radiusScale: 0.96,
    deform: 0.008,
    bandAmp: 0,
    flashInterval: 4.5,
    gold: 0,
    alert: 0,
    dim: 0.6,
  },
};

interface Pulse {
  path: number[]; // node indices of a random walk
  t0: number;
}

interface Ring {
  r: number;
  alpha: number;
  hue: number;
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

    // Checkmark morph targets: every k-th node maps to a point along the
    // glyph, ordered so consecutive morph nodes trace the stroke
    const M = Math.min(120, Math.floor(N * 0.5));
    const checkTargets = new Map<number, [number, number]>();
    const checkOrder: number[] = [];
    {
      const A = [-0.42 * R, 0.02 * R];
      const B = [-0.09 * R, 0.34 * R];
      const C = [0.52 * R, -0.36 * R];
      const len1 = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const len2 = Math.hypot(C[0] - B[0], C[1] - B[1]);
      const m1 = Math.max(2, Math.round((M * len1) / (len1 + len2)));
      for (let j = 0; j < M; j++) {
        const node = Math.floor((j * (N - 1)) / (M - 1));
        let tx: number, ty: number;
        if (j < m1) {
          const f = j / (m1 - 1);
          tx = A[0] + (B[0] - A[0]) * f;
          ty = A[1] + (B[1] - A[1]) * f;
        } else {
          const f = (j - m1) / (M - m1 - 1 || 1);
          tx = B[0] + (C[0] - B[0]) * f;
          ty = B[1] + (C[1] - B[1]) * f;
        }
        if (!checkTargets.has(node)) {
          checkTargets.set(node, [tx, ty]);
          checkOrder.push(node);
        }
      }
    }

    const pulses: Pulse[] = [];
    const rings: Ring[] = [];
    const nodeGlow = new Float32Array(N);
    const fractured = new Map<number, number>(); // edge index → flicker life

    const p = { ...STATE_PARAMS.idle };
    let radiusScale = 1;
    let radiusVelocity = 0;
    let rotY = 0.6;
    let userRotX = 0;
    let spinVelocity = 0;
    let lastState: MascotState = stateRef.current;
    let flashClock = 0;
    let ringClock = 0;
    let fractureClock = 0;
    let morph = 0;
    let morphVelocity = 0;
    let morphTarget = 0;
    let morphHoldUntil = 0;
    let t = 0;
    let lastTime = performance.now();
    let raf = 0;

    // Pointer interaction (hover attraction + drag-to-spin)
    const pointer = {
      x: 0,
      y: 0,
      inside: false,
      down: false,
      lastX: 0,
      lastY: 0,
    };
    const toLocal = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return [
        ((event.clientX - rect.left) / rect.width) * size,
        ((event.clientY - rect.top) / rect.height) * size,
      ];
    };
    const onEnter = () => {
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.down = false;
      canvas.style.cursor = "grab";
    };
    const onDown = (event: PointerEvent) => {
      pointer.down = true;
      [pointer.lastX, pointer.lastY] = toLocal(event);
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onUp = (event: PointerEvent) => {
      pointer.down = false;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };
    const onMove = (event: PointerEvent) => {
      const [x, y] = toLocal(event);
      pointer.x = x;
      pointer.y = y;
      pointer.inside = true;
      if (pointer.down) {
        const dx = x - pointer.lastX;
        const dy = y - pointer.lastY;
        rotY += dx * 0.008;
        userRotX = Math.max(-0.6, Math.min(0.6, userRotX + dy * 0.005));
        spinVelocity = dx * 0.3;
        pointer.lastX = x;
        pointer.lastY = y;
      }
    };
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointermove", onMove);

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

    const fracture = () => {
      const count = Math.floor(edges.length * 0.08);
      for (let k = 0; k < count; k++) {
        fractured.set(Math.floor(Math.random() * edges.length), 1);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      t += dt;

      const currentState = stateRef.current;
      const target = STATE_PARAMS[currentState];
      if (currentState !== lastState) {
        if (currentState === "celebrating") {
          morphTarget = 1;
          morphHoldUntil = t + 1.5;
          for (let i = 0; i < 3; i++) spawnPulse(t + i * 0.1);
        } else if (lastState === "celebrating") {
          if (morphTarget === 1) radiusVelocity += 1.6;
          morphTarget = 0;
        }
        if (currentState === "error") {
          fracture();
          rings.push({ r: 1.05, alpha: 0.6, hue: 6 });
        }
        lastState = currentState;
      }
      if (currentState === "celebrating" && morphTarget === 1 && t > morphHoldUntil) {
        morphTarget = 0;
        radiusVelocity += 1.9; // elastic pop as the glyph releases
      }

      p.rotSpeed = smooth(p.rotSpeed, target.rotSpeed, dt, 2.5);
      p.deform = smooth(p.deform, target.deform, dt, 3);
      p.bandAmp = smooth(p.bandAmp, target.bandAmp, dt, 4);
      p.gold = smooth(p.gold, target.gold, dt, 3);
      p.alert = smooth(p.alert, target.alert, dt, 4);
      p.dim = smooth(p.dim, target.dim, dt, 2.5);

      morphVelocity += (morphTarget - morph) * 46 * dt;
      morphVelocity *= Math.exp(-6.5 * dt);
      morph += morphVelocity * dt;
      const morphC = Math.max(0, Math.min(1, morph));

      // Springy radius keeps state changes feeling physical
      const springK = 50;
      const springD = 7;
      radiusVelocity += (target.radiusScale - radiusScale) * springK * dt;
      radiusVelocity *= Math.exp(-springD * dt);
      radiusScale += radiusVelocity * dt;

      if (!pointer.down) {
        rotY += dt * (p.rotSpeed + spinVelocity);
        spinVelocity *= Math.exp(-1.8 * dt);
        userRotX *= Math.exp(-0.4 * dt);
      }
      // Error: the rotation stutters
      if (p.alert > 0.1) {
        rotY += Math.sin(t * 23.7) * Math.sin(t * 7.3) * 0.006 * p.alert;
      }
      const rotX = 0.35 + 0.08 * Math.sin(t * 0.4) + userRotX;

      // Synapse pulses
      if (target.flashInterval > 0) {
        flashClock += dt;
        if (flashClock >= target.flashInterval) {
          flashClock = 0;
          spawnPulse(t);
        }
      }

      // Error: keep refreshing the fracture flicker
      if (currentState === "error") {
        fractureClock += dt;
        if (fractureClock > 0.7) {
          fractureClock = 0;
          fracture();
        }
      }
      for (const [key, life] of fractured) {
        const next = life - dt * 0.9;
        if (next <= 0) fractured.delete(key);
        else fractured.set(key, next);
      }

      // Listening: rings breathe inward toward the contracted sphere
      if (currentState === "listening") {
        ringClock += dt;
        if (ringClock > 0.9) {
          ringClock = 0;
          rings.push({ r: 1.7, alpha: 0.5, hue: 186 });
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
      const hoverRadius = size * 0.24;
      const hoverActive = pointer.inside && !pointer.down && morphC < 0.3;

      for (let i = 0; i < N; i++) {
        const [bx, by, bz] = base[i];
        // Per-node organic displacement
        const noise =
          Math.sin(i * 12.9898 + t * 2.3) * Math.sin(i * 78.233 + t * 1.7);
        const errJitter =
          p.alert > 0.1
            ? p.alert * 0.02 * Math.sin(i * 3.1 + t * 31)
            : 0;
        const r =
          R *
          radiusScale *
          (1 + p.deform * noise + errJitter + 0.015 * Math.sin(t * 1.2 + i));

        let x = bx * r;
        const y0 = by * r;
        const z = bz * r;

        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y0 * cosX - z1 * sinX;
        const z2 = y0 * sinX + z1 * cosX;

        const persp = FOCAL / (FOCAL + z2);
        x = cx + x1 * persp;
        let y = cy + y1 * persp;

        // Speaking: latitude bands sweep across the sphere
        const band =
          p.bandAmp > 0.01
            ? p.bandAmp * Math.max(0, Math.sin(Math.asin(by) * 5 - t * 6))
            : 0;

        const depth = (R * radiusScale - z2) / (2 * R * radiusScale); // 0 back → 1 front
        let brightness = 0.25 + depth * 0.75 + band + nodeGlow[i] * 1.1;

        // Celebration morph: glyph nodes converge, the rest disperse
        if (morphC > 0.001) {
          const glyph = checkTargets.get(i);
          if (glyph) {
            x += (cx + glyph[0] - x) * morphC;
            y += (cy + glyph[1] - y) * morphC;
            brightness += morphC * 0.7;
          } else {
            x += (x - cx) * 0.22 * morphC;
            y += (y - cy) * 0.22 * morphC;
            brightness *= 1 - morphC * 0.75;
          }
        }

        // Hover: nearby nodes lean toward the cursor and light up
        if (hoverActive) {
          const dxp = pointer.x - x;
          const dyp = pointer.y - y;
          const dist = Math.hypot(dxp, dyp);
          if (dist < hoverRadius) {
            const fall = 1 - dist / hoverRadius;
            x += dxp * 0.14 * fall;
            y += dyp * 0.14 * fall;
            brightness += fall * 0.55;
          }
        }

        projected[i * 4] = x;
        projected[i * 4 + 1] = y;
        projected[i * 4 + 2] = persp;
        projected[i * 4 + 3] = Math.min(1.6, brightness);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const lum = 1 - p.dim * 0.55;

      // Core ambient glow
      const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.8);
      aura.addColorStop(0, `hsla(350, 90%, 60%, ${0.16 * lum})`);
      aura.addColorStop(0.6, `hsla(280, 80%, 55%, ${0.07 * lum})`);
      aura.addColorStop(1, "hsla(280, 80%, 55%, 0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, size, size);

      ctx.globalCompositeOperation = "lighter";

      // Rings (listening pull-in, error alert)
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        const isAlert = ring.hue < 90;
        ring.r += dt * (isAlert ? 0.5 : -0.5);
        ring.alpha -= dt * 0.35;
        if (ring.alpha <= 0 || ring.r <= 0.95 || ring.r >= 2) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, R * radiusScale * ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${ring.hue}, 90%, 66%, ${ring.alpha * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Nodes shade rose → violet by latitude; gold lerps via hue 406 (≡46)
      // and alert via 368 (≡8) so blends pass through warm reds, not green.
      const stateHue = (baseHue: number) => {
        let hue = baseHue + (406 - baseHue) * p.gold;
        hue = hue + (368 - hue) * p.alert;
        return hue % 360;
      };

      // Edges
      ctx.lineWidth = 0.7 * Math.max(sizeFactor, 0.8);
      const edgeFade = (1 - morphC * 0.85) * lum;
      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e];
        const brightness =
          (projected[a * 4 + 3] + projected[b * 4 + 3]) / 2;
        const glow = Math.max(nodeGlow[a], nodeGlow[b]);
        let alpha = (0.08 + brightness * 0.16 + glow * 0.5) * edgeFade;
        const flicker = fractured.get(e);
        if (flicker !== undefined) {
          // Fractured edges strobe red
          alpha *= 0.3 + 0.7 * Math.abs(Math.sin(t * 37 + e));
          ctx.strokeStyle = `hsla(6, 95%, 62%, ${Math.min(1, alpha + flicker * 0.3)})`;
        } else {
          const hue = stateHue(350 - (base[a][1] + 1) * 45);
          ctx.strokeStyle =
            glow > 0.05
              ? `hsla(46, 100%, ${70 + glow * 20}%, ${alpha})`
              : `hsla(${hue}, 85%, 68%, ${alpha})`;
        }
        ctx.beginPath();
        ctx.moveTo(projected[a * 4], projected[a * 4 + 1]);
        ctx.lineTo(projected[b * 4], projected[b * 4 + 1]);
        ctx.stroke();
      }

      // Checkmark stroke traces through the glyph nodes while morphed
      if (morphC > 0.05) {
        ctx.lineWidth = 2.2 * sizeFactor;
        ctx.strokeStyle = `hsla(46, 100%, 72%, ${morphC * 0.85})`;
        ctx.beginPath();
        checkOrder.forEach((node, k) => {
          const x = projected[node * 4];
          const y = projected[node * 4 + 1];
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.lineWidth = 7 * sizeFactor;
        ctx.strokeStyle = `hsla(46, 100%, 70%, ${morphC * 0.16})`;
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
          ctx.fillStyle = `hsla(${hue}, 100%, 75%, ${(0.09 + glow * 0.25) * lum})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${85 + glow * 15}%, ${62 + brightness * 22}%, ${Math.min(1, 0.35 + brightness * 0.55) * lum})`;
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

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointermove", onMove);
    };
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
