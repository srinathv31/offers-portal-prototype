"use client";

import { CoralMascot, useCoralSkin } from "@/components/mascots";

/**
 * The coral mark in the app chrome — Coral's ambient presence on every
 * page. It always sits on its own dark disc so the mascot reads in both
 * themes. Five quick taps toggle the hidden Pip skin.
 */
export function CoralAvatar() {
  const { registerTap } = useCoralSkin();

  return (
    <button
      type="button"
      onClick={registerTap}
      aria-label="Coral Intelligence"
      title="Coral Intelligence"
      className="grid size-9 place-items-center overflow-hidden rounded-full bg-[#14101c] ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95 dark:ring-white/15"
    >
      <CoralMascot state="idle" size={30} />
    </button>
  );
}
