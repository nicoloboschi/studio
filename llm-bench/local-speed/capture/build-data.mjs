// build-data.mjs — local-LLM speed benchmark results (provided, "Completed — all OK").
// The video races on `peak` tok/s (concurrency 8) and shows the rest in the leaderboard.
// Edit and re-run to recut:  node llm-bench/local-speed/capture/build-data.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// rows as given (already ordered by peak tok/s, desc)
const models = [
  { name: "Qwen3.5-2B", single: 85.9, peak: 341.6, conc: "c8", prefill: 2397, schema: 0.8 },
  { name: "Phi-4-mini", single: 67.8, peak: 207.9, conc: "c8", prefill: 1081, schema: 1.0 },
  { name: "gemma-3-4b", single: 63.0, peak: 197.2, conc: "c8", prefill: 1064, schema: 1.0 },
  { name: "Qwen3.5-4B", single: 69.9, peak: 149.3, conc: "c8", prefill: 985, schema: 1.0 },
  { name: "Qwen3.5-9B", single: 27.8, peak: 72.5, conc: "c8", prefill: 386, schema: 1.0 },
];

const data = {
  title: "Local LLM speed test",
  raceMetric: "peak", // tok/s at concurrency 8 — what the racers race on
  raceLabel: "peak tok/s @ concurrency 8",
  models,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data.json");
writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
console.log(`wrote ${out} · ${models.length} models · fastest ${models[0].name} ${models[0].peak} peak tok/s`);
