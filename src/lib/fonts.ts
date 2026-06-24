// Registers the font families used across the studio. Importing this module (anywhere in the bundle)
// triggers the @font-face registration; design tokens reference the family names below.
//   hindsight + agent-memory: Inter + JetBrains Mono
//   llm-bench: Space Grotesk (display) + IBM Plex Mono (numbers) — a cooler, terminal-flavored pairing
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

export const { fontFamily: interFamily } = loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
export const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
export const { fontFamily: groteskFamily } = loadGrotesk("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
export const { fontFamily: plexMonoFamily } = loadPlexMono("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
