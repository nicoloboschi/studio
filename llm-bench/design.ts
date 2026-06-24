import type { Design } from "../src/lib/design";

/**
 * LLM-Bench brand tokens — machine-readable counterpart of ./DESIGN.md.
 * "Data-terminal" look: deep slate, a warm/cool amber↔azure duotone, Space Grotesk for names and
 * IBM Plex Mono for every number. Cool and nerdy but minimal and professional — no neon, no arcade.
 */
export const llmBench: Design = {
  bg: "#0C0E12",
  bg2: "#12151B",
  panel: "#161A21",
  panelBorder: "#262C36",
  text: "#E8EBF0",
  dim: "#98A2B0",
  faint: "#5A6472",
  accent: "#E8B563", // amber — model A / warm side / hero numbers
  accent2: "#5BA8F0", // azure — model B / cool side
  good: "#6FCF97",
  amber: "#E8B563",
  bad: "#E5707E",
  mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  sans: "'Space Grotesk', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

// the two head-to-head competitor colors (warm vs cool)
export const PAIR = { a: llmBench.accent, b: llmBench.accent2 };
// one color per racer for the multi-model leaderboard (amber, azure, emerald, iris, coral)
export const RACER_COLORS = ["#E8B563", "#5BA8F0", "#6FCF97", "#A98BF0", "#E58A6A"];
export const MEDALS = ["#E8B563", "#C2C9D2", "#C08457"]; // gold / silver / bronze (muted)
