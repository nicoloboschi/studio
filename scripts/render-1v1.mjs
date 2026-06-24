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
import { readFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
const base = `1v1_${slug(data.a.name)}_vs_${slug(data.b.name)}`;

// 3. render → X-optimize (yuv420p + silent audio track) → faststart, into the model-named file
const exportClip = (compId, suffix) => {
  const tmp = join(ROOT, "out", `_tmp_${suffix}.mp4`);
  const final = join(ROOT, "out", `${base}${suffix}.mp4`);
  run("npx", ["remotion", "render", "src/index.ts", compId, tmp, "--codec=h264", "--pixel-format=yuv420p", "--enforce-audio-track"]);
  run("npx", ["remotion", "ffmpeg", "-y", "-i", tmp, "-c", "copy", "-movflags", "+faststart", final]);
  try { unlinkSync(tmp); } catch {}
  console.log(`✓ ${final}`);
};

if (!argv.includes("--no-x")) exportClip("llm-bench-head-to-head-x", "_square");
if (argv.includes("--vertical")) exportClip("llm-bench-head-to-head", "_vertical");
