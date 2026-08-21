"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CoralLattice } from "./coral-lattice";
import { CoralPip } from "./coral-pip";
import { useCoralSkin } from "./coral-skin";
import type { MascotProps } from "./types";

/**
 * The production mascot component. Renders whichever skin is active —
 * Lattice by default, Pip once unlocked — and greets a skin switch with a
 * spring-in pop and a moment of celebration. Use this everywhere Coral
 * appears; reach for CoralLattice/CoralPip directly only when a surface
 * must pin a specific skin (e.g. a settings preview).
 */
export function CoralMascot({ state = "idle", size = 320, className }: MascotProps) {
  const { skin } = useCoralSkin();
  const [celebrating, setCelebrating] = useState(false);
  const previousSkin = useRef(skin);

  useEffect(() => {
    if (previousSkin.current === skin) return;
    previousSkin.current = skin;
    const start = window.setTimeout(() => setCelebrating(true), 0);
    const stop = window.setTimeout(() => setCelebrating(false), 1400);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [skin]);

  const effectiveState = celebrating ? "celebrating" : state;
  const Skin = skin === "pip" ? CoralPip : CoralLattice;

  return (
    <motion.span
      key={skin}
      initial={{ scale: 0.55, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      style={{ display: "inline-block", lineHeight: 0 }}
    >
      <Skin state={effectiveState} size={size} className={className} />
    </motion.span>
  );
}
