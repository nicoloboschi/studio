// render-1v1.mjs — the head-to-head template: pick two models, render the X-optimized 1v1,
// and name the file after the models.
//
// Usage:
//   npm run render:1v1 -- qwen gemma                       # square (X-ready) export
//   npm run render:1v1 -- qwen gemma --vertical            # also export the 9:16 vertical
//   npm run render:1v1 -- qwen gemma --results=~/dev/localmaxxing/results/run_xxx.json
//   npm run render:1v1                                     # first two models in latest.json
//
// Output: out/1v1_<modelA>_vs_<modelB>[_square|_vertical].mp4
//   square = 1080×1080, H.264 yuv420p, +faststart, silent AAC track — ready to upload to X/Twitter.

import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const COPY_DIR = join(homedir(), "dev/uploady/videos"); // each export is also copied here, display-named

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const RENDER_FLAGS = new Set(["--vertical", "--no-x"]);
const dataArgs = argv.filter((a) => !RENDER_FLAGS.has(a)); // model matches + --results pass through
const run = (cmd, a) => execFileSync(cmd, a, { cwd: ROOT, stdio: "inherit" });

// 1. generate data.json for the chosen pair
run("node", [join(ROOT, "llm-bench/head-to-head/capture/build-data.mjs"), ...dataArgs]);

// 2. derive the model-named output base
const data = JSON.parse(readFileSync(join(ROOT, "llm-bench/head-to-head/data.json"), "utf8"));
const slug = (s) => s.replace(/[^a-zA-Z0-9.]+/g, "-");
const base = `1v1_${slug(data.a.name)}_vs_${slug(data.b.name)}`; // safe working name in out/

// display name for the uploady copy, e.g. "Qwen3.5-2b vs Gemma3-4b | Apple M3 Max MLX"
const pretty = (n) =>
  n.replace(/([A-Za-z])-(\d)/, "$1$2")              // glue family to its first version (gemma-3 → gemma3)
    .replace(/^./, (c) => c.toUpperCase())          // capitalize family
    .replace(/([0-9.]+)B\b/g, "$1b");               // 2B → 2b
const chip = (data.machine || "").split(" · ")[0] || "local";
const backend = (data.runtime || "").split(" · ")[0] || "";
const niceBase = `${pretty(data.a.name)} vs ${pretty(data.b.name)} | ${chip} ${backend}`.trim();

// 3. render → X-optimize (yuv420p + faststart + audio) → out/, then copy display-named to COPY_DIR
const exportClip = (compId, suffix, aspectTag) => {
  const tmp = join(ROOT, "out", `_tmp_${suffix}.mp4`);
  const final = join(ROOT, "out", `${base}${suffix}.mp4`);
  run("npx", ["remotion", "render", "src/index.ts", compId, tmp, "--codec=h264", "--pixel-format=yuv420p", "--enforce-audio-track"]);
  run("npx", ["remotion", "ffmpeg", "-y", "-i", tmp, "-c", "copy", "-movflags", "+faststart", final]);
  try { unlinkSync(tmp); } catch {}
  console.log(`✓ ${final}`);
  mkdirSync(COPY_DIR, { recursive: true });
  const copyTo = join(COPY_DIR, `${niceBase}${aspectTag ? ` ${aspectTag}` : ""}.mp4`);
  copyFileSync(final, copyTo);
  console.log(`  ↳ ${copyTo}`);
};

if (!argv.includes("--no-x")) exportClip("llm-bench-head-to-head-x", "_square");
if (argv.includes("--vertical")) exportClip("llm-bench-head-to-head", "_vertical", "(9-16)");
