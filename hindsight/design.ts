import type { Design } from "../src/lib/design";

/**
 * Hindsight brand tokens — the machine-readable counterpart of ./DESIGN.md.
 * These mirror the real Hindsight product UI (the Embed Control Center / Control Plane),
 * extracted live from its CSS so videos read as an extension of the product:
 *   bg #09090B · text #E7E9EE · code/panel #141417 · border zinc-800 · brand blue→teal gradient
 *   (#0074D9 → #009296) · link #3396E8 · destructive #F0616D · Inter + JetBrains Mono.
 * Edit both together: DESIGN.md is the source of truth, this file implements it.
 */
export const hindsight: Design = {
  // surfaces — product near-black (zinc-950) with a faint radial lift
  bg: "#09090B",
  bg2: "#15151A",
  panel: "#141417",
  panelBorder: "#27272A",
  // text — product foreground + zinc muted/faint
  text: "#E7E9EE",
  dim: "#A1A1AA",
  faint: "#71717A",
  // accents — product brand blue→teal; link blue for legible accent text; product rose for destructive
  accent: "#3396E8",
  accent2: "#00A6A6",
  good: "#34D399",
  amber: "#FBBF24",
  bad: "#F0616D",
  // type — the product's fonts (loaded in src/lib/fonts.ts)
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  sans: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
