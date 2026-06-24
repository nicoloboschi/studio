import type { Design } from "../src/lib/design";

/**
 * Agent Memory brand tokens — the machine-readable counterpart of ./DESIGN.md.
 * A bolder, higher-contrast identity than hindsight/ (blue→teal product console), tuned for
 * vertical social shorts about agent memory as a concept:
 *   bg #0B0A12 · text #F4F2F8 · panel #16131F · violet→magenta brand gradient (#A78BFA → #F472B6) ·
 *   with-memory = violet, without-memory = rose. Inter + JetBrains Mono.
 * Edit both together: DESIGN.md is the source of truth, this file implements it.
 */
export const agentMemory: Design = {
  // surfaces — near-black with a violet radial lift
  bg: "#0B0A12",
  bg2: "#181327",
  panel: "#16131F",
  panelBorder: "#2A2633",
  // text
  text: "#F4F2F8",
  dim: "#B5B1C2",
  faint: "#7C7790",
  // accents — violet brand (with-memory) → magenta gradient end; semantic green/amber/rose
  accent: "#A78BFA",
  accent2: "#F472B6",
  good: "#4ADE80",
  amber: "#FBBF24",
  bad: "#FB7185",
  // type — shared product fonts (loaded in src/lib/fonts.ts)
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  sans: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
