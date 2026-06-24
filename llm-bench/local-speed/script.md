# local-speed — local LLM speed-test video

- **Brand:** llm-bench · **Composition id:** `llm-bench-local-speed` · **1080×1920 (9:16)** · 30fps · ~25s
- **Goal:** a fun, data-driven benchmark short — numbers and names, a drag race, then a leaderboard.

## Beats

| # | Scene | ~frames | What happens |
|---|-------|---------|--------------|
| 1 | **Intro** | 0–70 | *LOCAL · **SPEED TEST*** (lime→cyan). "5 models · racing on peak tok/s @ concurrency 8." |
| 2 | **The race** | 70–370 | 5 colored runners (one per model) race left→right; speed ∝ peak tok/s; the number above each **counts up**; checkered finish; **Qwen3.5-2B** crosses first → 🏆 + confetti at **341.6**. |
| 3 | **Leaderboard** | 370–650 | Ranked rows with medals: name + `single` / `peak @c8` / `prefill` / `schema`. Winner highlighted; **schema 0.8** shown amber (the one caveat). |
| 4 | **Close** | 650–750 | *fastest **Qwen3.5-2B 341.6** peak tok/s @ c8* · "Smallest model, most tokens — at schema 0.8." · llm-bench |

## The data (`data.json`, from `capture/build-data.mjs`)

The provided "Completed (all OK)" results, ordered by peak tok/s:

| # | model | single tok/s | peak tok/s @c8 | prefill tok/s | schema |
|---|-------|---|---|---|---|
| 1 | Qwen3.5-2B | 85.9 | **341.6** | 2397 | 0.8 |
| 2 | Phi-4-mini | 67.8 | 207.9 | 1081 | 1.0 |
| 3 | gemma-3-4b | 63.0 | 197.2 | 1064 | 1.0 |
| 4 | Qwen3.5-4B | 69.9 | 149.3 | 985 | 1.0 |
| 5 | Qwen3.5-9B | 27.8 | 72.5 | 386 | 1.0 |

The race metric is `raceMetric` in `data.json` (`peak`). Everything is data-driven — the video maps over
`models`, so adding a model or new run just means editing `capture/build-data.mjs` and re-rendering.

## Re-generating / extending

```bash
node llm-bench/local-speed/capture/build-data.mjs      # rewrites data.json
npm run render -- llm-bench-local-speed out/llm-bench-local-speed.mp4
```

Ideas for follow-ups (same brand): race on `single` tok/s, a `prefill` race, or a "quality vs speed"
scatter (schema vs tok/s). Add more models and they slot into the race + leaderboard automatically.
