"use client";

import { useEffect, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import {
  CoralBloom,
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
  chooseIf: string;
  accent: string;
  Component: ComponentType<MascotProps>;
}

const DIRECTIONS: Direction[] = [
  {
    id: "bloom",
    number: "01",
    name: "Bloom",
    philosophy: "The Organism",
    tagline: "Intelligence that feels alive, not mechanical.",
    description:
      "A living coral polyp — generative, breathing, bioluminescent. Bloom never repeats a frame: its body is computed from layered harmonics, motes of light drift through it, and a warm nucleus swims inside. States are expressed as energy and accent light, so the presence always stays calm, ambient, and unmistakably organic.",
    principles: [
      "Breathes with the workload — reasoning literally churns inside it",
      "Accent light signals state: aqua absorbs, violet reasons, gold delivers",
      "Zero anthropomorphism — authority through serenity, not cuteness",
    ],
    chooseIf:
      "You want Coral to feel like a calm, living presence woven into the product — premium and brand-first.",
    accent: "#ff7a5c",
    Component: CoralBloom,
  },
  {
    id: "lattice",
    number: "02",
    name: "Lattice",
    philosophy: "The Constellation",
    tagline: "Intelligence as orchestration, made visible.",
    description:
      "A constellation of data points wired into a living network — a nod to what Coral actually does: reasoning across campaigns, accounts, and systems. Lattice shows its thinking. Synapse pulses travel the graph while it reasons, the structure contracts to listen, and banded waves radiate outward as it responds.",
    principles: [
      "The network is the metaphor — every node is a system Coral orchestrates",
      "Visible computation builds trust: you can watch signals propagate",
      "Reads as engineering-grade — credibility for a financial platform",
    ],
    chooseIf:
      "You want Coral to project technical depth and precision — an AI that enterprise stakeholders instinctively trust.",
    accent: "#b78bfa",
    Component: CoralLattice,
  },
  {
    id: "pip",
    number: "03",
    name: "Pip",
    philosophy: "The Companion",
    tagline: "Intelligence as a colleague, not a system.",
    description:
      "A small coral creature with a face — and therefore a relationship. Pip blinks on its own rhythm, follows your cursor, leans in when you type, glances up while it thinks, and bounces with squash-and-stretch when a campaign ships. Personality creates forgiveness, engagement, and memory in a way abstract marks can't.",
    principles: [
      "Eye contact and micro-behaviors make every session feel attended",
      "Emotion maps to workflow: attentive → curious → chatty → delighted",
      "Disarms the intimidation of an AI touching money and campaigns",
    ],
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
        <header className="mb-20 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#ff7a5c]">
            Coral Intelligence
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Meet the face of Coral.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/60">
            Three mascot directions, three philosophies — an organism, a
            constellation, and a companion. Each one is fully alive: it idles,
            listens while you type, visibly thinks, speaks, and celebrates when
            a campaign ships. Click the states or let the auto-demo cycle.
          </p>
          <nav className="mt-8 flex flex-wrap gap-3">
            {DIRECTIONS.map((direction) => (
              <a
                key={direction.id}
                href={`#${direction.id}`}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                <span
                  className="mr-2 font-mono text-xs"
                  style={{ color: direction.accent }}
                >
                  {direction.number}
                </span>
                {direction.name} — {direction.philosophy}
              </a>
            ))}
          </nav>
        </header>

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
          </div>
          <p className="mt-12 text-center text-sm text-white/35">
            Pick a direction and we&apos;ll iterate — states, sizes, sounds,
            and the full design system around it.
          </p>
        </footer>
      </div>
    </div>
  );
}
