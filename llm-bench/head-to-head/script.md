# head-to-head — reusable 1v1 template

A **template**: pick any two models from a `localmaxxing` run and render a dynamic, X-ready 1v1.

- **Brand:** llm-bench · **Composition ids:** `llm-bench-head-to-head` (9:16, 1080×1920) and
  `llm-bench-head-to-head-x` (**1:1, 1080×1080 — for X/Twitter**). One responsive component serves both.
- **Format:** fast round-by-round match, no intro/outro. A persistent scorebar (with model **icons**) ticks
  the result. Cool/minimal "data-terminal" style (amber↔azure, Space Grotesk + IBM Plex Mono).

## Rounds (each its own metric)

| # | Round | Metric | Viz |
|---|-------|--------|-----|
| 1 | SINGLE STREAM | single-stream tok/s | racing bars |
| 2 | PARALLELISM | aggregate tok/s at **every** concurrency (c1·c2·c4·c8 together) | grouped bars |
| 3 | PREFILL | prefill tok/s | racing bars |
| 4 | STRUCTURED OUTPUT | valid-JSON-per-schema tasks (x/5) | pips |
| 5 | SIZE | GB on disk (smaller wins) | proportional blocks |

## Reuse it for any pair

The data + filename come from the models, so retargeting is one command:

```bash
# render the X-ready square, named after the models → out/1v1_<A>_vs_<B>_square.mp4
npm run render:1v1 -- qwen3.5-2b gemma-3-4b
npm run render:1v1 -- qwen3.5-9b mistral            # any two; matches repo/family/name substrings
npm run render:1v1 -- qwen gemma --vertical          # also export the 9:16 vertical
npm run render:1v1 -- qwen phi --results=~/dev/localmaxxing/results/run_20260624_105440.json
npm run render:1v1                                   # first two completed models in latest.json
```

`render:1v1` = `build-data.mjs` (writes `data.json` for the pair) → render → **X-optimize**
(1080×1080, H.264 **yuv420p**, **+faststart**, silent **AAC** track so X accepts it) → write
`out/1v1_<A>_vs_<B>_square.mp4`. Just the data step: `node capture/build-data.mjs <matchA> <matchB>`.

## Data (`data.json`, from `capture/build-data.mjs`)

Per side: `name` (repo with quant/instruct suffixes stripped), `icon`, `params_b`, `size_gb`,
`downloads`, `single`, `prefill`, `levels[{c,agg}]`, `schema_ok`, `schema_total`.

**Source (default):** the **`vendor/localmaxxing` git submodule** — its per-model pool
`vendor/localmaxxing/results/models/*.json` (each file holds one model under `.result`). Pull updates
with `git submodule update --remote vendor/localmaxxing`. Override with `--results=<path>` pointing at
either a models **directory** or a run-snapshot JSON (top-level `models[]`); falls back to
`~/dev/localmaxxing/...` if the submodule is absent.

## Model icons

Drop a logo at **`public/icons/<family>.png`** (lowercase leading family word, e.g. `qwen.png`,
`gemma.png`, `phi.png`, `mistral.png`). `build-data.mjs` auto-links it; the video shows it next to the
name in the scorebar and every round. **No icon → a colored dot** (amber for A, azure for B). 28px art
is fine; it's shown small.
