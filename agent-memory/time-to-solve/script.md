# time-to-solve — short script (memory system vs agentic search on files)

- **Brand:** agent-memory · **Composition id:** `agent-memory-time-to-solve` · **1080×1920 (9:16)** · 30fps · **6s, loops seamlessly**
- **Format:** vertical social short / GIF. No intro, no scenes — one looping idea.
- **The matchup:** *Agentic search on files* vs a *Memory system* — the current "do you even need a
  memory layer, or can the agent just grep/read files?" debate. This short takes the **speed** axis.
- **The whole video:** two horizontal tracks, each with a **ball bouncing left↔right**.
  - Top — *Agentic search* (rose): slow. It re-reads the files every query (search → read → search…).
  - Bottom — *Memory system* (violet): the same ball, **~10× faster** — one recall, sub-second.
  - A live **"answered" counter** on each track diverges (the fast lane answers more queries per unit
    time). Bottom copy: *10× faster — recall once vs re-read every time.* + a source credit.
- **Why it's honest / sourced:** the multiple is read from `data.json` (`speedup`), grounded in real
  numbers: memory recall ≈ **0.2s** p95 search latency on LoCoMo (Mem0), vs multi-step agentic retrieval
  running into **seconds** (~5s reported) from repeated tool calls. We show a **conservative ~10×**
  (0.2s vs ~2s); the raw figures imply ~25×. See `capture/build-data.mjs` for figures + URLs.
  - **Axis = speed/round-trips per query**, not accuracy.

## How the motion works

- Each ball is a constant-speed bounce (triangle wave) between the track walls.
- `SLOW_CYCLE = 90` frames per round-trip; `FAST_CYCLE = round(SLOW_CYCLE / speedup)` = 9.
- Loop length = `SLOW_CYCLE × 2` = **180 frames** → exactly 2 slow laps / 20 fast laps, so the GIF loops
  with no seam. Each there-and-back = one query "answered".

## Re-generating

```bash
node agent-memory/time-to-solve/capture/build-data.mjs     # rewrites data.json from the cited anchors
npm run render -- agent-memory-time-to-solve out/agent-memory-time-to-solve.mp4
```

Update the cited figures by editing the latency anchors / `SOURCES` in `capture/build-data.mjs` and
re-running; the balls + caption pick up the new `speedup` automatically (no hardcoded number in `Video.tsx`).

## Notes

- Rose = agentic search, violet = memory system (brand semantics, see `../DESIGN.md`).
- Keep it wordless except the two labels + the one-line takeaway — it has to read in a feed in <2s.
