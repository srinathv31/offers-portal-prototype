"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import type { MascotProps, MascotState } from "./types";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Pip — "The Companion"
 *
 * A small coral creature with a face. Personality does the work here:
 * Pip blinks, follows your cursor, leans in to listen, glances up to
 * think, chatters while speaking, and bounces with squash-and-stretch
 * when a task lands. Built on motion springs so every pose change
 * feels physical.
 */

const EYE_BIAS: Record<MascotState, { x: number; y: number }> = {
  idle: { x: 0, y: 0 },
  listening: { x: 0, y: -1 },
  thinking: { x: 4.5, y: -4.5 },
  speaking: { x: 0, y: 0.5 },
  celebrating: { x: 0, y: 0 },
};

const bodyVariants = {
  still: { y: 0, rotate: 0, scaleX: 1, scaleY: 1 },
  idle: {
    y: [0, -5, 0],
    rotate: 0,
    scaleX: [1, 1.01, 1],
    scaleY: [1, 1.02, 1],
    transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" as const },
  },
  listening: {
    y: -2,
    rotate: -5,
    scaleX: 1.03,
    scaleY: 1.03,
    transition: { type: "spring" as const, stiffness: 250, damping: 17 },
  },
  thinking: {
    y: [0, -3, 0],
    rotate: [2, 3.5, 2],
    scaleX: 1,
    scaleY: 1,
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const },
  },
  speaking: {
    y: [0, -2.5, 0],
    rotate: 0,
    scaleX: 1,
    scaleY: [1, 1.015, 1],
    transition: { duration: 0.38, repeat: Infinity, ease: "easeInOut" as const },
  },
  celebrating: {
    y: [0, -21, 0, -9, 0],
    rotate: 0,
    scaleX: [1, 0.93, 1.09, 0.97, 1],
    scaleY: [1, 1.1, 0.9, 1.05, 1],
    transition: {
      duration: 0.9,
      repeat: Infinity,
      repeatDelay: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const shadowVariants = {
  still: { scaleX: 1, opacity: 0.22 },
  idle: {
    scaleX: [1, 0.94, 1],
    opacity: 0.22,
    transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" as const },
  },
  listening: { scaleX: 1.02, opacity: 0.24 },
  thinking: { scaleX: 1, opacity: 0.22 },
  speaking: { scaleX: 1, opacity: 0.22 },
  celebrating: {
    scaleX: [1, 0.72, 1.06, 0.9, 1],
    opacity: [0.22, 0.1, 0.26, 0.16, 0.22],
    transition: {
      duration: 0.9,
      repeat: Infinity,
      repeatDelay: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const frondVariants = {
  sway: (i: number) => ({
    rotate: [-5, 5],
    transition: {
      duration: 1.9 + i * 0.45,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const,
    },
  }),
  party: (i: number) => ({
    rotate: [-16, 16],
    transition: {
      duration: 0.28 + i * 0.05,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const,
    },
  }),
  still: { rotate: 0 },
};

const fadeGroup = {
  on: { opacity: 1 },
  off: { opacity: 0, transition: { duration: 0.25 } },
};

const SPARKLES = [
  { x: 30, y: 52, s: 1, d: 0 },
  { x: 170, y: 42, s: 1.25, d: 0.18 },
  { x: 22, y: 122, s: 0.8, d: 0.36 },
  { x: 178, y: 108, s: 1, d: 0.52 },
  { x: 100, y: 16, s: 0.9, d: 0.7 },
  { x: 146, y: 158, s: 0.85, d: 0.62 },
];

const STAR_PATH =
  "M0,-6 L1.7,-1.7 L6,0 L1.7,1.7 L0,6 L-1.7,1.7 L-6,0 L-1.7,-1.7 Z";

export function CoralPip({
  state = "idle",
  size = 320,
  className,
}: MascotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [blink, setBlink] = useState(false);

  const pointerRef = useRef({ x: 0, y: 0, lastMove: 0 });
  const stateRef = useRef<MascotState>(state);

  const eyeTargetX = useMotionValue(0);
  const eyeTargetY = useMotionValue(0);
  const eyeX = useSpring(eyeTargetX, { stiffness: 320, damping: 24 });
  const eyeY = useSpring(eyeTargetY, { stiffness: 320, damping: 24 });
  const tiltTarget = useMotionValue(0);
  const tilt = useSpring(tiltTarget, { stiffness: 120, damping: 16 });

  useEffect(() => {
    stateRef.current = state;
    const bias = EYE_BIAS[state];
    eyeTargetX.set(pointerRef.current.x + bias.x);
    eyeTargetY.set(pointerRef.current.y + bias.y);
  }, [state, eyeTargetX, eyeTargetY]);

  // Cursor tracking with idle wander
  useEffect(() => {
    if (reducedMotion) return;

    const applyEyes = () => {
      const bias = EYE_BIAS[stateRef.current];
      eyeTargetX.set(pointerRef.current.x + bias.x);
      eyeTargetY.set(pointerRef.current.y + bias.y);
      tiltTarget.set(pointerRef.current.x * 0.5);
    };

    const onPointerMove = (event: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      pointerRef.current = {
        x: Math.max(-1, Math.min(1, dx * 2)) * 4,
        y: Math.max(-1, Math.min(1, dy * 2)) * 3,
        lastMove: performance.now(),
      };
      applyEyes();
    };

    const wander = window.setInterval(() => {
      if (performance.now() - pointerRef.current.lastMove < 3500) return;
      pointerRef.current.x = (Math.random() - 0.5) * 6;
      pointerRef.current.y = (Math.random() - 0.5) * 4;
      applyEyes();
    }, 2600);

    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.clearInterval(wander);
    };
  }, [reducedMotion, eyeTargetX, eyeTargetY, tiltTarget]);

  // Blinks — random cadence, occasional double blink
  useEffect(() => {
    if (reducedMotion) return;
    let timeout: number;
    let cancelled = false;

    const schedule = (delay: number) => {
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setBlink(false);
          if (Math.random() < 0.22) {
            window.setTimeout(() => !cancelled && setBlink(true), 130);
            window.setTimeout(() => !cancelled && setBlink(false), 240);
          }
        }, 110);
        schedule(2400 + Math.random() * 3200);
      }, delay);
    };
    schedule(1600);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [reducedMotion]);

  const animState = reducedMotion ? "still" : state;
  const overlay = (target: MascotState) =>
    !reducedMotion && state === target ? "on" : "off";
  const happy = state === "celebrating";

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Coral Intelligence mascot — Pip"
      className={cn("select-none overflow-visible", className)}
    >
      <defs>
        <linearGradient id="pip-body" x1="0.2" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#ffb36b" />
          <stop offset="52%" stopColor="#ff7a5c" />
          <stop offset="100%" stopColor="#f74f78" />
        </linearGradient>
        <radialGradient id="pip-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ff6d5e" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#ff6d5e" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ff6d5e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pip-sheen" cx="0.35" cy="0.25" r="0.6">
          <stop offset="0%" stopColor="#ffe3c4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffe3c4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="104" r="88" fill="url(#pip-glow)" />

      <motion.ellipse
        cx="100"
        cy="181"
        rx="46"
        ry="6.5"
        fill="#1c0f1e"
        variants={shadowVariants}
        animate={animState}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
      />

      {/* Listening — sound waves arriving from the side Pip leans toward */}
      <motion.g
        variants={fadeGroup}
        animate={overlay("listening")}
        initial="off"
        stroke="#7fd8e8"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      >
        {[0, 1].map((i) => (
          <motion.path
            key={i}
            d={
              i === 0
                ? "M30,88 Q20,102 30,116"
                : "M44,92 Q37,102 44,112"
            }
            animate={{ opacity: [0, 0.9, 0], x: [4, -3] }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              delay: i * 0.45,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.g>

      {/* Thinking — bubbles drifting up and to the right */}
      <motion.g variants={fadeGroup} animate={overlay("thinking")} initial="off">
        {[
          { cx: 142, cy: 54, r: 3.4 },
          { cx: 155, cy: 40, r: 4.8 },
          { cx: 170, cy: 23, r: 6.4 },
        ].map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="#c7a5ff"
            animate={{ opacity: [0.15, 0.95, 0.15], scale: [0.7, 1.05, 0.7] }}
            transition={{
              duration: 1.7,
              repeat: Infinity,
              delay: i * 0.28,
              ease: "easeInOut",
            }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}
      </motion.g>

      {/* Body + face — outer group runs state poses, inner group adds cursor tilt */}
      <motion.g
        variants={bodyVariants}
        animate={animState}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <motion.g
          style={{
            rotate: reducedMotion ? 0 : tilt,
            transformBox: "fill-box",
            transformOrigin: "50% 85%",
          }}
        >
          {/* Fronds */}
          {[
            { x: 78, y: 52, angle: -22, h: 17 },
            { x: 100, y: 44, angle: 0, h: 20 },
            { x: 122, y: 52, angle: 22, h: 17 },
          ].map((frond, i) => (
            <motion.g
              key={i}
              custom={i}
              variants={frondVariants}
              animate={
                reducedMotion ? "still" : happy ? "party" : "sway"
              }
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
            >
              <g transform={`rotate(${frond.angle} ${frond.x} ${frond.y})`}>
                <rect
                  x={frond.x - 3}
                  y={frond.y - frond.h}
                  width="6"
                  height={frond.h + 6}
                  rx="3"
                  fill="#ff8f6d"
                />
                <circle
                  cx={frond.x}
                  cy={frond.y - frond.h}
                  r="4.4"
                  fill="#ffd9a8"
                />
              </g>
            </motion.g>
          ))}

          {/* Body */}
          <path
            d="M100,166 C58,166 34,140 34,106 C34,64 60,38 100,38 C140,38 166,64 166,106 C166,140 142,166 100,166 Z"
            fill="url(#pip-body)"
          />
          <path
            d="M100,166 C58,166 34,140 34,106 C34,64 60,38 100,38 C140,38 166,64 166,106 C166,140 142,166 100,166 Z"
            fill="url(#pip-sheen)"
          />

          {/* Blush */}
          <motion.g
            animate={{ opacity: happy ? 0.55 : 0.3 }}
            transition={{ duration: 0.3 }}
          >
            <ellipse cx="66" cy="112" rx="9" ry="5.5" fill="#ff5a5a" />
            <ellipse cx="134" cy="112" rx="9" ry="5.5" fill="#ff5a5a" />
          </motion.g>

          {/* Eyes */}
          {[82, 118].map((eyeCx) => (
            <g key={eyeCx}>
              {/* Happy arc (celebrating) */}
              <motion.path
                d={`M${eyeCx - 9},96 Q${eyeCx},84 ${eyeCx + 9},96`}
                stroke="#35203b"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
                animate={{ opacity: happy ? 1 : 0 }}
                transition={{ duration: 0.15 }}
              />
              {/* Pupil */}
              <motion.g
                animate={{ opacity: happy ? 0 : 1 }}
                transition={{ duration: 0.15 }}
              >
                <motion.g style={{ x: eyeX, y: eyeY }}>
                  <motion.g
                    animate={{ scaleY: blink ? 0.1 : 1 }}
                    transition={{ duration: 0.09 }}
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "50% 50%",
                    }}
                  >
                    <rect
                      x={eyeCx - 6.5}
                      y="82"
                      width="13"
                      height="21"
                      rx="6.5"
                      fill="#35203b"
                    />
                    <circle
                      cx={eyeCx - 2.5}
                      cy="87.5"
                      r="2.6"
                      fill="#fff"
                      opacity="0.9"
                    />
                  </motion.g>
                </motion.g>
              </motion.g>
            </g>
          ))}

          {/* Mouths — crossfaded per state */}
          <motion.path
            d="M89,119 Q100,127 111,119"
            stroke="#4a2340"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            animate={{ opacity: state === "idle" ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.circle
            cx="100"
            cy="122"
            r="4"
            fill="#4a2340"
            animate={{ opacity: state === "listening" ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.path
            d="M93,122 L107,119"
            stroke="#4a2340"
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ opacity: state === "thinking" ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.g
            animate={{ opacity: state === "speaking" ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.ellipse
              cx="100"
              cy="122"
              rx="7"
              ry="6"
              fill="#4a2340"
              animate={
                !reducedMotion && state === "speaking"
                  ? { scaleY: [0.35, 1, 0.5, 1.05, 0.35] }
                  : { scaleY: 0.5 }
              }
              transition={
                state === "speaking"
                  ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            />
          </motion.g>
          <motion.path
            d="M86,116 Q100,134 114,116 Q100,122 86,116 Z"
            fill="#4a2340"
            animate={{ opacity: happy ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          />
        </motion.g>
      </motion.g>

      {/* Celebrating — sparkle burst, drawn above the body */}
      <motion.g variants={fadeGroup} animate={overlay("celebrating")} initial="off">
        {SPARKLES.map((spark, i) => (
          <g key={i} transform={`translate(${spark.x}, ${spark.y})`}>
            <motion.path
              d={STAR_PATH}
              fill="#ffd76b"
              animate={{
                opacity: [0, 1, 0],
                scale: [0, spark.s, 0],
                rotate: [0, 95],
              }}
              transition={{
                duration: 1.15,
                repeat: Infinity,
                delay: spark.d,
                ease: "easeInOut",
              }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            />
          </g>
        ))}
      </motion.g>
    </svg>
  );
}
