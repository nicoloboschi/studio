# mission-sandbox — demo video script

- **Brand:** hindsight (see [`../DESIGN.md`](../DESIGN.md))
- **Composition id:** `hindsight-mission-sandbox`
- **Format:** 1920×1080 · 30fps · ~74s (2220 frames)
- **Goal:** make a viewer who has never heard of Hindsight understand the *problem* and *why this
  tool helps* — before any jargon.
- **Data:** real. `capture/capture.py` runs the merged engine's `extract_facts_from_text` (what the
  dry-run endpoint runs internally) with Gemini 2.5 Flash over the "Maya" notes, for a narrow vs a
  refined retain mission, and scores golden coverage with a real Gemini judge → [`data.json`](./data.json).
  Numbers shown (3/8 → 8/8) come straight from that file.

## Beats

| # | Scene | Frames | Says |
|---|-------|--------|------|
| 1 | **Hook** | 0–150 | "AI agents forget." Hindsight gives them memory by extracting durable facts. |
| 2 | **The catch** | 150–360 | What's remembered is steered by a *retain mission* (plain-English instructions). Too narrow → the agent **silently forgets**. (One fact kept ✓, two dropped ✗.) |
| 3 | **The tool** | 360–570 | mission-sandbox in 3 steps: write the **golden set** → **dry-run** a mission (nothing stored) → read **coverage**. |
| 4 | **Meet Maya** | 570–810 | Three real notes Maya tells her assistant over a few months. |
| 5 | **Test #1 — narrow mission** | 810–1230 | `retain check` → real extraction → 3 facts → **3/8**. Kept her job; forgot dog/move/plans/tastes. |
| 6 | **The fix** | 1230–1530 | `retain mission --feedback "…"` rewrites the mission (before/after shown). |
| 7 | **Test #2 — refined mission** | 1530–1980 | Same notes, same golden set → 12 facts → **8/8** (checklist flips ✓). |
| 8 | **Outro** | 1980–2220 | `3/8 → 8/8`. Tune the mission, not the data. No re-ingest. Nothing stored. |

## Narration / on-screen copy

Kept terse and on-screen (no VO track yet). Every term is glossed inline the first time:
*retain mission* = "plain-English instructions that steer what gets extracted"; *golden set* = "the
facts you've decided the agent must remember"; *coverage* = "how many golden facts were captured";
*dry-run* = "real extraction, nothing stored".

## Re-generating

```bash
# 1. (optional) refresh the real data — needs a Gemini key in hindsight-api-slim/.env
cd <hindsight-repo>/hindsight-api-slim && uv run python <studio>/hindsight/mission-sandbox/capture/capture.py
#    (writes /tmp/mission-demo/demo-data.json → copy to ./data.json)
# 2. preview / iterate
cd <studio> && npm run studio          # opens the Remotion studio in a browser
# 3. render
npm run render -- hindsight-mission-sandbox out/hindsight-mission-sandbox.mp4
```
