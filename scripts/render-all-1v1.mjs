// render-all-1v1.mjs — render EVERY unique pair of completed models (incl. same family / different
// size), via render-1v1.mjs. Defaults to vertical-only into out/ + ~/dev/uploady/videos.
//
// Usage:
//   npm run render:1v1:all                 # all pairs, vertical (9:16) → ~/dev/uploady/videos
//   npm run render:1v1:all -- --square     # all pairs, square (1:1)  → ~/Documents/x1v1
//   npm run render:1v1:all -- --both       # all pairs, BOTH formats in one pass
//   (any extra flags, e.g. --music=…, are passed through to render-1v1)

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = join(ROOT, "vendor/localmaxxing/results/models");

// completed models, sorted small → large; match key = unique repo basename
const models = readdirSync(MODELS_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => { const j = JSON.parse(readFileSync(join(MODELS_DIR, f), "utf8")); return j.result ?? j; })
  .filter((m) => m.status === "ok" && m.speed && m.prefill && m.schema)
  .sort((a, b) => a.params_b - b.params_b)
  .map((m) => m.repo.split("/").pop());

const pairs = [];
for (let i = 0; i < models.length; i++) for (let j = i + 1; j < models.length; j++) pairs.push([models[i], models[j]]);

const argv = process.argv.slice(2);
// --both = square (default) + vertical · --square = square only · default = vertical only
const aspect = argv.includes("--both") ? ["--vertical"] : argv.includes("--square") ? [] : ["--vertical", "--no-x"];
const passthru = argv.filter((a) => a !== "--square" && a !== "--both");
const label = argv.includes("--both") ? "square + vertical" : argv.includes("--square") ? "square" : "vertical";

console.log(`${models.length} models → ${pairs.length} matchups (${label})`);
let ok = 0, fail = 0;
pairs.forEach(([a, b], i) => {
  process.stdout.write(`[${i + 1}/${pairs.length}] ${a} vs ${b} … `);
  try {
    execFileSync("node", [join(ROOT, "scripts/render-1v1.mjs"), a, b, ...aspect, ...passthru], { cwd: ROOT, stdio: ["ignore", "ignore", "ignore"] });
    ok++; console.log("ok");
  } catch {
    fail++; console.log("FAILED");
  }
});
// leave the studio default on a sensible pair
try { execFileSync("node", [join(ROOT, "llm-bench/head-to-head/capture/build-data.mjs"), "qwen3.5-2b", "gemma-3-4b"], { cwd: ROOT, stdio: "ignore" }); } catch {}
console.log(`\ndone — ${ok} ok, ${fail} failed`);
