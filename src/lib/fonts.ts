// Loads the Hindsight product fonts (Inter + JetBrains Mono) so videos match the real UI.
// Importing this module registers the @font-face rules; the family names ("Inter",
// "JetBrains Mono") are what hindsight/design.ts references in its `sans`/`mono` tokens.
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: interFamily } = loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
export const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
