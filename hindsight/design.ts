import type { Design } from "../src/lib/design";

/**
 * Hindsight brand tokens — the machine-readable counterpart of ./DESIGN.md.
 * Edit both together: DESIGN.md is the source of truth, this file implements it.
 * Every video under hindsight/ wraps itself in <DesignProvider design={hindsight}>.
 */
export const hindsight: Design = {
  // surfaces — deep navy, subtle radial wash
  bg: "#0B1020",
  bg2: "#111935",
  panel: "#0E1530",
  panelBorder: "#26314f",
  // text
  text: "#E8ECF8",
  dim: "#8A95B5",
  faint: "#5B658A",
  // accents — indigo → cyan brand gradient; green/amber/rose for semantics
  accent: "#6E8BFF",
  accent2: "#22D3EE",
  good: "#34D399",
  amber: "#FBBF24",
  bad: "#FB7185",
  // type — system sans for prose, mono for code/terminal/numbers
  mono: "'SF Mono','JetBrains Mono','Fira Code',ui-monospace,Menlo,monospace",
  sans: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
};
