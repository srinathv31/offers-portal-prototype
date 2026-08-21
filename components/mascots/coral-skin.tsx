"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Coral's skin system. Lattice is the mascot; Pip lives on as an unlockable
 * skin. The active skin is shared through a lightweight external store
 * (localStorage-backed, cross-tab via the storage event) so every Coral
 * surface — nav mark, chat avatar, thinking indicator — switches together.
 *
 * Two ways to toggle:
 *   1. Tap the coral mark five times in quick succession
 *   2. The classic code: ↑ ↑ ↓ ↓ ← → ← → B A
 */

export type CoralSkin = "lattice" | "pip";

const STORAGE_KEY = "coral-skin";
const TAP_WINDOW_MS = 1600;
const TAPS_TO_TOGGLE = 5;
const KONAMI = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

// Module-level store; memorySkin covers environments without localStorage
const listeners = new Set<() => void>();
let memorySkin: CoralSkin = "lattice";

function readSkin(): CoralSkin {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "pip" || stored === "lattice") return stored;
  } catch {
    // storage unavailable
  }
  return memorySkin;
}

function writeSkin(next: CoralSkin) {
  memorySkin = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // storage unavailable — session-only skin
  }
  listeners.forEach((listener) => listener());
  if (next === "pip") {
    console.log(
      "%c🪸 pip says hi",
      "color:#ff7a5c;font-size:14px;font-weight:bold"
    );
  }
}

function subscribeSkin(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

interface CoralSkinContextValue {
  skin: CoralSkin;
  setSkin: (skin: CoralSkin) => void;
  toggleSkin: () => void;
  /** Call on each tap/click of a coral mark; 5 quick taps toggle the skin. */
  registerTap: () => void;
}

const CoralSkinContext = createContext<CoralSkinContextValue>({
  skin: "lattice",
  setSkin: () => {},
  toggleSkin: () => {},
  registerTap: () => {},
});

export function useCoralSkin() {
  return useContext(CoralSkinContext);
}

export function CoralSkinProvider({ children }: { children: ReactNode }) {
  const skin = useSyncExternalStore<CoralSkin>(
    subscribeSkin,
    readSkin,
    () => "lattice"
  );
  const taps = useRef({ count: 0, last: 0 });

  const setSkin = useCallback((next: CoralSkin) => writeSkin(next), []);
  const toggleSkin = useCallback(
    () => writeSkin(readSkin() === "lattice" ? "pip" : "lattice"),
    []
  );

  const registerTap = useCallback(() => {
    const now = performance.now();
    const tap = taps.current;
    tap.count = now - tap.last < TAP_WINDOW_MS ? tap.count + 1 : 1;
    tap.last = now;
    if (tap.count >= TAPS_TO_TOGGLE) {
      tap.count = 0;
      toggleSkin();
    }
  }, [toggleSkin]);

  // Konami listener
  useEffect(() => {
    let progress = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      progress =
        key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
      if (progress === KONAMI.length) {
        progress = 0;
        toggleSkin();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSkin]);

  return (
    <CoralSkinContext.Provider
      value={{ skin, setSkin, toggleSkin, registerTap }}
    >
      {children}
    </CoralSkinContext.Provider>
  );
}
