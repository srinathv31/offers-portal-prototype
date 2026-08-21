"use client";

import { useEffect, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import {
  AgentPlayground,
  CoralLattice,
  CoralPip,
  MASCOT_STATES,
  type MascotProps,
  type MascotState,
} from "@/components/mascots";

interface Direction {
  id: string;
  number: string;
  name: string;
  philosophy: string;
  tagline: string;
  description: string;
  principles: string[];
  stageHint: string;
  chooseIf: string;
  accent: string;
  Component: ComponentType<MascotProps>;
}

const DIRECTIONS: Direction[] = [
  {
    id: "lattice",
    number: "01",
    name: "Lattice",
    philosophy: "The Constellation",
    tagline: "Intelligence as orchestration, made visible.",
    description:
      "A constellation of data points wired into a living network — a nod to what Coral actually does: reasoning across campaigns, accounts, and systems. Lattice shows its thinking: synapse pulses travel the graph while it reasons, the structure contracts to listen, and banded waves radiate as it responds. It's tactile too — drag to spin it, hover and nearby nodes reach toward you. When a task lands, the whole network gathers into a golden checkmark, holds, and springs back.",
    principles: [
      "The network is the metaphor — every node is a system Coral orchestrates",
      "Visible computation builds trust: watch signals propagate, watch errors fracture",
      "The checkmark morph turns “task done” into a signature brand moment",
    ],
    stageHint: "Drag to spin · hover to connect",
    chooseIf:
      "You want Coral to project technical depth and precision — an AI that enterprise stakeholders instinctively trust.",
    accent: "#b78bfa",
    Component: CoralLattice,
  },
  {
    id: "pip",
    number: "02",
    name: "Pip",
    philosophy: "The Companion",
    tagline: "Intelligence as a colleague, not a system.",
    description:
      "A small coral creature with a face — and therefore a relationship. Pip blinks on its own rhythm, follows your cursor, leans in when you type, glances up while it thinks, and bounces with squash-and-stretch when a campaign ships. It slumps with worried brows when a system fails, dozes off with drifting z's after hours, and startles if you poke it. Personality creates forgiveness, engagement, and memory in a way abstract marks can't.",
    principles: [
      "Eye contact and micro-behaviors make every session feel attended",
      "A full emotional register: attentive, curious, chatty, delighted, worried, asleep",
      "Disarms the intimidation of an AI touching money and campaigns",
    ],
    stageHint: "Click Pip · move your cursor",
    chooseIf:
      "You want users to love Coral — a warm daily companion that gives the platform a memorable personality.",
    accent: "#ffd76b",
    Component: CoralPip,
  },
];

const CYCLE_MS = 3400;

function StateControls({
  active,
  auto,
  accent,
  onSelect,
  onToggleAuto,
}: {
  active: MascotState;
  auto: boolean;
  accent: string;
  onSelect: (state: MascotState) => void;
  onToggleAuto: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {MASCOT_STATES.map((entry) => {
        const isActive = entry.value === active;
        return (
          <button
            key={entry.value}
            type="button"
            onClick={() => onSelect(entry.value)}
            title={entry.hint}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
              isActive
                ? "border-transparent text-[#14101c]"
                : "border-white/15 text-white/60 hover:border-white/35 hover:text-white/90"
            )}
            style={isActive ? { backgroundColor: accent } : undefined}
          >
            {entry.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onToggleAuto}
        className={cn(
          "ml-1 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
          auto
            ? "border-white/40 bg-white/10 text-white"
            : "border-white/15 text-white/50 hover:border-white/35 hover:text-white/80"
        )}
      >
        {auto ? "◉ Auto-demo" : "○ Auto-demo"}
      </button>
    </div>
  );
}

function InProductPreview({
  Component,
  accent,
  state,
}: {
  Component: ComponentType<MascotProps>;
  accent: string;
  state: MascotState;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
        At product scale
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1 pr-3">
            <div className="grid size-7 place-items-center overflow-hidden rounded-full bg-black/30">
              <Component state={state} size={26} />
            </div>
            <span className="text-xs font-medium text-white/80">
              Coral Intelligence
            </span>
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: accent }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2 pl-3">
          <Component state={state} size={40} />
          <span className="flex-1 text-sm text-white/35">
            Ask Coral to build a targeting strategy…
          </span>
          <div
            className="grid size-8 place-items-center rounded-xl text-sm font-semibold text-[#14101c]"
            style={{ backgroundColor: accent }}
          >
            ↑
          </div>
        </div>
      </div>
    </div>
  );
}

function MascotSection({ direction }: { direction: Direction }) {
  const [state, setState] = useState<MascotState>("idle");
  const [auto, setAuto] = useState(true);
  const { Component } = direction;

  useEffect(() => {
    if (!auto) return;
    const order = MASCOT_STATES.map((entry) => entry.value);
    const interval = window.setInterval(() => {
      setState((current) => {
        const index = order.indexOf(current);
        return order[(index + 1) % order.length];
      });
    }, CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [auto]);

  return (
    <section id={direction.id} className="scroll-mt-24">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Stage */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(120%_120%_at_50%_0%,#181128_0%,#0c0916_55%,#080610_100%)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(60% 55% at 50% 50%, ${direction.accent}14 0%, transparent 70%)`,
            }}
          />
          <div className="relative grid place-items-center px-6 py-10 sm:py-14">
            <Component state={state} size={340} />
          </div>
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: direction.accent }}
            />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
              {direction.name} / {state}
            </span>
          </div>
          <span className="pointer-events-none absolute bottom-4 right-5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/25">
            {direction.stageHint}
          </span>
        </div>

        {/* Narrative */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-2 flex items-baseline gap-3">
              <span
                className="font-mono text-sm font-semibold"
                style={{ color: direction.accent }}
              >
                {direction.number}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">
                {direction.philosophy}
              </span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white">
              {direction.name}
            </h2>
            <p className="mt-2 text-lg text-white/75">{direction.tagline}</p>
          </div>

          <p className="text-sm leading-relaxed text-white/55">
            {direction.description}
          </p>

          <ul className="flex flex-col gap-2">
            {direction.principles.map((principle) => (
              <li
                key={principle}
                className="flex items-start gap-2.5 text-sm text-white/65"
              >
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: direction.accent }}
                />
                {principle}
              </li>
            ))}
          </ul>

          <StateControls
            active={state}
            auto={auto}
            accent={direction.accent}
            onSelect={(next) => {
              setAuto(false);
              setState(next);
            }}
            onToggleAuto={() => setAuto((value) => !value)}
          />

          <InProductPreview
            Component={Component}
            accent={direction.accent}
            state={state}
          />
        </div>
      </div>
    </section>
  );
}

export default function MascotsPage() {
  return (
    <div className="min-h-screen bg-[#080610] bg-[radial-gradient(80%_50%_at_50%_-10%,#1b1030_0%,transparent_60%)]">
      <div className="container mx-auto max-w-6xl px-4 pb-28 pt-16 sm:pt-20">
        {/* Hero */}
        <header className="mb-16 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#ff7a5c]">
            Coral Intelligence
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Two finalists.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/60">
            Lattice and Pip, expanded: seven states each — including error and
            sleeping — plus real interactivity. Watch them run an actual agent
            workflow below, then dig into each direction. Drag Lattice. Poke
            Pip.
          </p>
        </header>

        {/* Agent playground */}
        <section id="playground" className="mb-24 scroll-mt-24">
          <div className="mb-6 flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-white">Watch Coral work</h2>
            <p className="text-sm text-white/45">
              scripted runs through the real state machine
            </p>
          </div>
          <AgentPlayground />
        </section>

        {/* Sections */}
        <div className="flex flex-col gap-24">
          {DIRECTIONS.map((direction) => (
            <MascotSection key={direction.id} direction={direction} />
          ))}
        </div>

        {/* Decision guide */}
        <footer className="mt-28">
          <h3 className="mb-8 text-center text-2xl font-bold text-white">
            Which Coral is your Coral?
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {DIRECTIONS.map((direction) => {
              const { Component } = direction;
              return (
                <div
                  key={direction.id}
                  className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center"
                >
                  <Component state="idle" size={120} />
                  <p className="text-sm font-semibold text-white">
                    {direction.name}
                    <span className="ml-2 font-normal text-white/45">
                      {direction.philosophy}
                    </span>
                  </p>
                  <p className="text-sm leading-relaxed text-white/55">
                    {direction.chooseIf}
                  </p>
                </div>
              );
            })}
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 bg-transparent p-6 text-center">
              <div className="flex items-center gap-4 py-4">
                <CoralLattice state="idle" size={88} />
                <span className="text-lg text-white/30">+</span>
                <CoralPip state="idle" size={88} />
              </div>
              <p className="text-sm font-semibold text-white">
                Or both
                <span className="ml-2 font-normal text-white/45">
                  The System &amp; the Face
                </span>
              </p>
              <p className="text-sm leading-relaxed text-white/55">
                Lattice as the brand mark and processing visual; Pip as an
                optional companion skin users can enable. Serious by default,
                lovable by choice.
              </p>
            </div>
          </div>
          <p className="mt-12 text-center text-sm text-white/35">
            Pick the direction and we&apos;ll productionize it — sizes, sound,
            entrance animations, and the design system around it.
          </p>
        </footer>
      </div>
    </div>
  );
}
