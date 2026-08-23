# Coral Intelligence — Mascot System

Lattice is Coral's mascot. Pip lives on as a hidden, unlockable skin.
This directory is self-contained and designed to be ported into the real
Coral repo mostly as-is.

## Files

| File | What it is |
| --- | --- |
| `coral-mascot.tsx` | **Use this one.** Renders the active skin; pops + celebrates on skin switch |
| `coral-skin.tsx` | `CoralSkinProvider` + `useCoralSkin` — skin state, persistence, unlock mechanics |
| `coral-lattice.tsx` | The mascot: canvas constellation (drag, hover, checkmark morph) |
| `coral-pip.tsx` | The easter-egg skin: SVG character on motion springs (poke it) |
| `agent-playground.tsx` | Demo-only: scripted chat runs that drive the state machine |
| `types.ts` | `MascotState`, `MascotProps`, `MASCOT_STATES` |
| `use-reduced-motion.ts` | Shared `prefers-reduced-motion` hook |

`components/coral-avatar.tsx` (one level up) is the nav-bar mark — the
mascot on a dark disc, wired as the 5-tap easter-egg trigger.

## Setup

```tsx
// app/layout.tsx
<CoralSkinProvider>
  <Navigation />   {/* contains <CoralAvatar /> */}
  {children}
</CoralSkinProvider>
```

```tsx
// anywhere Coral appears
<CoralMascot state="thinking" size={44} />
```

Only `motion` is an external dependency (Pip). Lattice is dependency-free
canvas. Both respect `prefers-reduced-motion` and render legibly down to
~26px avatars (Lattice adapts its node count to size).

## Mapping agent lifecycle → states

| Your agent event | `MascotState` |
| --- | --- |
| Surface open, nothing happening | `idle` |
| User typing / voice input active | `listening` |
| Request in flight, tools running | `thinking` |
| Response streaming | `speaking` |
| Task finished successfully | `celebrating` (Lattice forms a checkmark) |
| Tool/system failure, needs attention | `error` |
| Long idle timeout / off-hours | `sleeping` |

Set `celebrating` for ~2s then return to `idle`; the checkmark morph
runs on entry to the state, holds ~1.5s, and releases on its own.

## The easter egg

Two triggers, both handled by `CoralSkinProvider`:

1. **5 quick taps** on any element that calls `registerTap()` from
   `useCoralSkin()` (the nav `CoralAvatar` does this).
2. **Konami code** — ↑ ↑ ↓ ↓ ← → ← → B A — from anywhere.

The toggle persists in `localStorage` under `coral-skin` and applies to
every `CoralMascot` instantly via context. When porting, swap the
`localStorage` read/write in `coral-skin.tsx` for your user-preferences
service if you want the skin to roam across devices.
