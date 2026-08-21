"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CoralLattice } from "./coral-lattice";
import { CoralPip } from "./coral-pip";
import type { MascotState } from "./types";

/**
 * A scripted mock of Coral's chat surface. Two scenario runs (a happy path
 * and an error-plus-recovery) drive the mascot through its real workflow
 * states — listening while the user types, thinking with live status,
 * streaming a reply, celebrating the result, and erroring when a system
 * fails. Switch mascots mid-run; the scenario keeps playing.
 */

type Role = "user" | "agent" | "status" | "error" | "result";

interface Message {
  id: number;
  role: Role;
  text: string;
}

const STATE_ACCENT: Record<MascotState, string> = {
  idle: "rgba(255,255,255,0.5)",
  listening: "#7fd8e8",
  thinking: "#b78bfa",
  speaking: "#ffd76b",
  celebrating: "#ffd76b",
  error: "#ff5a5a",
  sleeping: "#c7a5ff",
};

export function AgentPlayground() {
  const [mascot, setMascot] = useState<"lattice" | "pip">("lattice");
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [composer, setComposer] = useState("");
  const [running, setRunning] = useState<"happy" | "recovery" | null>(null);

  const runToken = useRef(0);
  const nextId = useRef(1);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, composer]);

  const run = useCallback(
    async (kind: "happy" | "recovery") => {
      const token = ++runToken.current;
      const alive = () => runToken.current === token;
      const wait = (ms: number) =>
        new Promise<void>((resolve) => setTimeout(resolve, ms));

      const push = (role: Role, text: string) => {
        const id = nextId.current++;
        setMessages((prev) => [...prev, { id, role, text }]);
        return id;
      };
      const update = (id: number, text: string) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, text } : m))
        );
      const remove = (id: number) =>
        setMessages((prev) => prev.filter((m) => m.id !== id));

      const typeIntoComposer = async (text: string) => {
        setMascotState("listening");
        for (let i = 1; i <= text.length; i++) {
          if (!alive()) return false;
          setComposer(text.slice(0, i));
          await wait(26);
        }
        await wait(350);
        if (!alive()) return false;
        setComposer("");
        push("user", text);
        return true;
      };

      const stream = async (text: string) => {
        setMascotState("speaking");
        const id = push("agent", "");
        for (let i = 1; i <= text.length; i++) {
          if (!alive()) return false;
          update(id, text.slice(0, i));
          await wait(13);
        }
        return true;
      };

      setRunning(kind);
      setMessages([]);
      setComposer("");
      setMascotState("idle");
      await wait(500);
      if (!alive()) return;

      if (kind === "happy") {
        if (
          !(await typeIntoComposer(
            "Which dormant Platinum accounts should we target for a Q4 dining boost?"
          ))
        )
          return;

        setMascotState("thinking");
        const status = push("status", "Scanning 12,438 accounts across 3 segments…");
        await wait(2000);
        if (!alive()) return;
        update(status, "Simulating uplift against the Q3 baseline…");
        await wait(1800);
        if (!alive()) return;
        remove(status);

        if (
          !(await stream(
            "I found 3,214 dormant Platinum accounts with strong dining affinity. A 5× dining-points offer projects +$1.9M incremental spend at 92% confidence — I've drafted the campaign with a three-wave rollout for your review."
          ))
        )
          return;

        setMascotState("celebrating");
        push("result", "Campaign draft ready — Dining Reactivation · Q4");
        await wait(2800);
        if (!alive()) return;
        setMascotState("idle");
      } else {
        if (
          !(await typeIntoComposer(
            "Publish the approved Dining Reactivation campaign to fulfillment."
          ))
        )
          return;

        setMascotState("thinking");
        const status = push("status", "Connecting to the fulfillment gateway…");
        await wait(1900);
        if (!alive()) return;

        setMascotState("error");
        remove(status);
        push("error", "FULFILLMENT-API · timed out after 30s");
        await wait(1400);
        if (!alive()) return;
        if (
          !(await stream(
            "The fulfillment gateway isn't responding. Retrying through the secondary route…"
          ))
        )
          return;
        setMascotState("thinking");
        const retry = push("status", "Retrying via the secondary gateway…");
        await wait(2000);
        if (!alive()) return;
        remove(retry);

        if (
          !(await stream(
            "Done — the campaign is live in the fulfillment queue. Wave 1 begins tomorrow at 9:00 AM; I'll monitor enrollments and flag anything unusual."
          ))
        )
          return;

        setMascotState("celebrating");
        push("result", "Published — 3 waves scheduled");
        await wait(2800);
        if (!alive()) return;
        setMascotState("idle");
      }

      if (alive()) setRunning(null);
    },
    []
  );

  // Auto-play the happy path once on first view
  const autoPlayed = useRef(false);
  useEffect(() => {
    if (autoPlayed.current) return;
    autoPlayed.current = true;
    const timeout = setTimeout(() => run("happy"), 900);
    return () => clearTimeout(timeout);
  }, [run]);

  const accent = STATE_ACCENT[mascotState];
  const Mascot = mascot === "lattice" ? CoralLattice : CoralPip;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-black/40">
            <Mascot state={mascotState} size={44} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Coral Intelligence
            </p>
            <p
              className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {mascotState}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-full border border-white/15 p-0.5">
            {(["lattice", "pip"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMascot(option)}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-medium capitalize transition-colors",
                  mascot === option
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Transcript */}
        <div className="flex h-[420px] flex-col">
          <div
            ref={transcriptRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-5"
          >
            {messages.length === 0 && !composer && (
              <p className="m-auto text-sm text-white/30">
                Pick a scenario to watch Coral work →
              </p>
            )}
            {messages.map((message) => {
              if (message.role === "status") {
                return (
                  <div
                    key={message.id}
                    className="flex items-center gap-2 self-center font-mono text-[11px] tracking-wide text-white/40"
                  >
                    <span className="size-1.5 animate-pulse rounded-full bg-[#b78bfa]" />
                    {message.text}
                  </div>
                );
              }
              if (message.role === "error") {
                return (
                  <div
                    key={message.id}
                    className="self-center rounded-full border border-[#ff5a5a]/30 bg-[#ff5a5a]/10 px-3.5 py-1 font-mono text-[11px] tracking-wide text-[#ff8080]"
                  >
                    ⚠ {message.text}
                  </div>
                );
              }
              if (message.role === "result") {
                return (
                  <div
                    key={message.id}
                    className="self-center rounded-full border border-[#ffd76b]/30 bg-[#ffd76b]/10 px-3.5 py-1 font-mono text-[11px] tracking-wide text-[#ffd76b]"
                  >
                    ✓ {message.text}
                  </div>
                );
              }
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "self-end rounded-br-md bg-white/12 text-white/90"
                      : "self-start rounded-bl-md bg-[#1a1226] text-white/80"
                  )}
                >
                  {message.text}
                </div>
              );
            })}
          </div>

          {/* Composer mock */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5">
              <span
                className={cn(
                  "flex-1 text-sm",
                  composer ? "text-white/85" : "text-white/30"
                )}
              >
                {composer || "Ask Coral anything…"}
                {composer && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/70 align-middle" />
                )}
              </span>
              <div
                className="grid size-8 shrink-0 place-items-center rounded-xl text-sm font-semibold text-[#14101c] transition-colors"
                style={{ backgroundColor: composer ? accent : "rgba(255,255,255,0.15)" }}
              >
                ↑
              </div>
            </div>
          </div>
        </div>

        {/* Scenario picker + live stage */}
        <div className="flex flex-col gap-3 border-t border-white/10 p-5 lg:border-l lg:border-t-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
            Scenarios
          </p>
          <button
            type="button"
            onClick={() => run("happy")}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
              running === "happy"
                ? "border-[#ffd76b]/50 bg-[#ffd76b]/10 text-white"
                : "border-white/15 text-white/70 hover:border-white/35 hover:text-white"
            )}
          >
            <span className="font-medium">Draft a campaign</span>
            <span className="mt-0.5 block text-xs text-white/40">
              listen → think → respond → celebrate
            </span>
          </button>
          <button
            type="button"
            onClick={() => run("recovery")}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
              running === "recovery"
                ? "border-[#ff5a5a]/50 bg-[#ff5a5a]/10 text-white"
                : "border-white/15 text-white/70 hover:border-white/35 hover:text-white"
            )}
          >
            <span className="font-medium">Publish with a hiccup</span>
            <span className="mt-0.5 block text-xs text-white/40">
              error → retry → recover
            </span>
          </button>
          <div className="mt-auto grid place-items-center rounded-2xl border border-white/10 bg-black/25 p-4">
            <Mascot state={mascotState} size={150} />
          </div>
        </div>
      </div>
    </div>
  );
}
