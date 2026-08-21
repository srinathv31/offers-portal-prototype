export type MascotState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "celebrating"
  | "error"
  | "sleeping";

export interface MascotProps {
  state?: MascotState;
  /** Rendered width/height in px. Mascots are square. */
  size?: number;
  className?: string;
}

export const MASCOT_STATES: {
  value: MascotState;
  label: string;
  hint: string;
}[] = [
  { value: "idle", label: "Idle", hint: "Ambient presence" },
  { value: "listening", label: "Listening", hint: "User is typing / speaking" },
  { value: "thinking", label: "Thinking", hint: "Reasoning across systems" },
  { value: "speaking", label: "Speaking", hint: "Streaming a response" },
  { value: "celebrating", label: "Celebrating", hint: "Task completed" },
  { value: "error", label: "Error", hint: "Blocked — needs attention" },
  { value: "sleeping", label: "Sleeping", hint: "Idle timeout / off-hours" },
];
