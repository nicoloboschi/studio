// render-1v1.mjs — the head-to-head template: pick two models, render the X-optimized 1v1,
// and write a display-named file straight to its destination folder (nothing kept in out/).
//
// Usage:
//   npm run render:1v1 -- qwen gemma                       # square (1:1) → ~/Documents/x1v1
//   npm run render:1v1 -- qwen gemma --vertical            # also 9:16 → ~/dev/uploady/videos
//   npm run render:1v1 -- qwen gemma --vertical --no-x     # vertical only
//   npm run render:1v1 -- qwen gemma --results=~/dev/localmaxxing/results/run_xxx.json
//   npm run render:1v1                                     # first two models in latest.json
//
// File name: "<A> vs <B> | <chip> <backend>.mp4" (e.g. "Qwen3.5-2b vs Gemma3-4b | Apple M3 Max MLX.mp4").
// Each clip is H.264 yuv420p + faststart + AAC soundtrack — ready to upload.

import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";

// destination per aspect — exports go here directly, not to out/
const DEST = {
  square: join(homedir(), "Documents/x1v1"),       // 1:1 for X
  vertical: join(homedir(), "dev/uploady/videos"), // 9:16 for uploady
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const RENDER_FLAGS = new Set(["--vertical", "--no-x"]);
const dataArgs = argv.filter((a) => !RENDER_FLAGS.has(a)); // model matches + --results pass through
const run = (cmd, a) => execFileSync(cmd, a, { cwd: ROOT, stdio: "inherit" });

// 1. generate data.json for the chosen pair
run("node", [join(ROOT, "llm-bench/head-to-head/capture/build-data.mjs"), ...dataArgs]);

// 2. display name, e.g. "Qwen3.5-2b vs Gemma3-4b | Apple M3 Max MLX"
const data = JSON.parse(readFileSync(join(ROOT, "llm-bench/head-to-head/data.json"), "utf8"));
const pretty = (n) =>
  n.replace(/([A-Za-z])-(\d)/, "$1$2")              // glue family to its first version (gemma-3 → gemma3)
    .replace(/^./, (c) => c.toUpperCase())          // capitalize family
    .replace(/([0-9.]+)B\b/g, "$1b");               // 2B → 2b
const chip = (data.machine || "").split(" · ")[0] || "local";
const backend = (data.runtime || "").split(" · ")[0] || "";
const niceBase = `${pretty(data.a.name)} vs ${pretty(data.b.name)} | ${chip} ${backend}`.trim();

// 3. render → X-optimize (yuv420p + faststart + audio) straight into the destination folder
const exportClip = (compId, kind) => {
  const tmp = join(tmpdir(), `1v1_${kind}_${process.pid}.mp4`);
  const destDir = DEST[kind];
  mkdirSync(destDir, { recursive: true });
  const final = join(destDir, `${niceBase}.mp4`);
  run("npx", ["remotion", "render", "src/index.ts", compId, tmp, "--codec=h264", "--pixel-format=yuv420p", "--enforce-audio-track"]);
  run("npx", ["remotion", "ffmpeg", "-y", "-i", tmp, "-c", "copy", "-movflags", "+faststart", final]);
  try { unlinkSync(tmp); } catch {}
  console.log(`✓ ${final}`);
};

const doSquare = !argv.includes("--no-x");
const doVertical = argv.includes("--vertical");
if (doSquare) exportClip("llm-bench-head-to-head-x", "square");
if (doVertical) exportClip("llm-bench-head-to-head", "vertical");
