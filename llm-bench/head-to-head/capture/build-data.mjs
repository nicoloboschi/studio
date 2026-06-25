// build-data.mjs — generate the 1v1 data.json from the localmaxxing benchmark data.
//
// Source (default): the `vendor/localmaxxing` submodule's per-model results directory
//   vendor/localmaxxing/results/models/*.json   (each file = one model, data under `.result`)
// Override with --results=<path> pointing at either a models DIRECTORY or a run-snapshot JSON
// (which has a top-level `models` array). Falls back to ~/dev/localmaxxing if the submodule is absent.
//
// Usage:
//   node build-data.mjs                      # first two completed models in the pool
//   node build-data.mjs <matchA> <matchB>    # pick two by case-insensitive substring (repo/family/name)
//   node build-data.mjs qwen gemma --results=~/dev/localmaxxing/results/latest.json

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const STUDIO = join(here, "..", "..", ".."); // capture → head-to-head → llm-bench → studio
const iconFor = (family) => {
  const key = String(family || "").toLowerCase().match(/^[a-z]+/)?.[0];
  return key && existsSync(join(STUDIO, "public", "icons", `${key}.png`)) ? key : null;
};

const argv = process.argv.slice(2);
const flags = Object.fromEntries(argv.filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? true]; }));
const names = argv.filter((a) => !a.startsWith("--"));

const expand = (p) => p.replace(/^~(?=$|\/)/, homedir());
const SUBMODULE_MODELS = join(STUDIO, "vendor/localmaxxing/results/models");
const src = flags.results
  ? expand(String(flags.results))
  : existsSync(SUBMODULE_MODELS) ? SUBMODULE_MODELS : join(homedir(), "dev/localmaxxing/results/latest.json");

// load the model pool from either a directory of per-model files or a single run snapshot
const loadPool = (p) => {
  if (statSync(p).isDirectory()) {
    const items = readdirSync(p).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(p, f), "utf8")));
    return { models: items.map((j) => j.result ?? j), machine: items.find((i) => i.machine)?.machine, when: items[0]?.measured_at };
  }
  const j = JSON.parse(readFileSync(p, "utf8"));
  return { models: j.models ?? [], machine: j.machine, when: j.started_at };
};

const pool = loadPool(src);
const ok = pool.models.filter((m) => m.status === "ok" && m.speed && m.prefill && m.schema);
if (ok.length < 2) throw new Error(`need >=2 completed models in ${src}, found ${ok.length}`);

const QUANT = /^(4bit|8bit|6bit|3bit|2bit|bf16|fp16|fp8|q4|q8|gguf|mlx|it|qat|instruct|chat|sft|hf)$/i;
const displayName = (repo) => {
  const parts = repo.split("/").pop().split("-");
  while (parts.length > 1 && QUANT.test(parts[parts.length - 1])) parts.pop();
  // truncate at the size token (…-24B-…) so long variant names stay short, e.g.
  // Mistral-Small-3.2-24B-Instruct-2506 → Mistral-Small-3.2-24B
  const sizeIdx = parts.findIndex((p) => /^\d+(\.\d+)?b$/i.test(p));
  return (sizeIdx >= 0 ? parts.slice(0, sizeIdx + 1) : parts).join("-");
};
const pick = (match, fallbackIdx) => {
  if (!match) return ok[fallbackIdx];
  const m = ok.find((x) => [x.repo, x.family, displayName(x.repo), `${x.params_b}b`].some((s) => String(s).toLowerCase().includes(match.toLowerCase())));
  if (!m) throw new Error(`no completed model matching "${match}" in ${src}`);
  return m;
};

const r1 = (x) => Math.round(x * 10) / 10;
const toSide = (m) => ({
  name: displayName(m.repo),
  icon: iconFor(m.family),
  params_b: m.params_b,
  size_gb: m.size_gb,
  downloads: m.downloads_30d ?? 0,
  single: r1(m.speed.single_stream_tokens_per_s),
  prefill: r1(m.prefill.max_prefill_tokens_per_s),
  levels: m.speed.levels.map((l) => ({ c: l.concurrency, agg: r1(l.aggregate_tokens_per_s) })),
  schema_ok: m.schema.schema_ok,
  schema_total: m.schema.num_tasks,
});

const ma = pick(names[0], 0), mb = pick(names[1], 1);
const a = toSide(ma);
const b = toSide(mb);
if (a.name === b.name) throw new Error(`both sides resolved to "${a.name}" — give two distinct matches`);

const machine = [pool.machine?.chip, pool.machine?.ram_gb ? `${pool.machine.ram_gb} GB` : null].filter(Boolean).join(" · ") || "local";
// runtime badge shown at the top of the video. Derived from the data (MLX models + the recorded chip),
// overridable with --runtime="..." (e.g. if the benchmark mis-detects the chip).
const shortChip = (pool.machine?.chip || "").replace(/^Apple\s+/i, "") || "local";
const backendLabel = /mlx/i.test(ma.repo) ? "MLX" : (ma.backend || "").toUpperCase();
const ram = pool.machine?.ram_gb ? `${pool.machine.ram_gb} GB` : null;
const runtime = flags.runtime ? String(flags.runtime) : [backendLabel, shortChip, ram].filter(Boolean).join(" · ");

const data = {
  headline: `1v1 — ${a.name} vs ${b.name} across every axis (${pool.machine?.chip ?? "local"}).`,
  machine,
  runtime,
  repo: "nicoloboschi/localmaxxing",
  // royalty-free soundtrack (public/music/*); override with --music=<file>, or "" for silent
  music: flags.music !== undefined ? String(flags.music) : "give.mixkit.mp3",
  source: `${src.replace(STUDIO + "/", "")}${pool.when ? ` (${pool.when})` : ""}`,
  a, b,
};
writeFileSync(join(here, "..", "data.json"), JSON.stringify(data, null, 2) + "\n");
console.log(`wrote data.json · ${a.name} vs ${b.name} · from ${src.replace(STUDIO + "/", "")}`);
