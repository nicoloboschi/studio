# mission-sandbox — demo video script (v2: the loop)

- **Brand:** hindsight · **Composition id:** `hindsight-mission-sandbox` · 1920×1080 · 30fps · ~50s
- **Centerpiece:** a **chat + terminal split** — the assistant's answers (felt value) on the left, the
  loop that fixes them (the tool) on the right. The read-only UI is **cut**.
- **Medium:** animated in Remotion, driven by **real captured data** (eval answers + scores from the
  live tool run: `maya-v1` 1/6 → `maya-v2` 6/6, in `data.json`).
- **Story:** show the agent **fail**, change one plain-English line, show it **succeed**. Problem →
  diagnosis → fix → win.

## The real data we animate (verbatim)

The user's eval = 6 questions the app must answer from memory.

| Question | v1 (narrow mission) | v2 (refined mission) |
|---|---|---|
| What does Maya do for work? | ✓ "senior product designer at Lumen Labs" | ✓ "...at Lumen Labs in Austin" |
| Which city does Maya live in now? | ✗ "I don't have that in my memory." | ✓ "Maya settled into Austin." |
| Does Maya have any pets? | ✗ "I don't have that in my memory." | ✓ "adopted a rescue greyhound named Pixel." |
| What new hobby is Maya taking up? | ✗ "I don't have that in my memory." | ✓ "taking up pottery." |
| Any trips planned? | ✗ "I don't have that in my memory." | ✓ "a solo trip to Lisbon in September." |
| Any change to Maya's diet? | ✗ "I don't have that in my memory." | ✓ "switched to oat milk (dairy upset her stomach)." |
| **Eval score** | **1/6** | **6/6** |

## Beats

| # | Scene | ~secs | What happens |
|---|-------|-------|--------------|
| 1 | **The pain** | 0–7 | Just a chat. User: *"Do I have any pets?"* → Assistant: *"I don't have that in my memory."* Title: **Your assistant should know you. This one doesn't.** |
| 2 | **Measure it (eval)** | 7–20 | Split appears. Right(terminal): `mission-sandbox retain apply` then the eval runs. Left(chat): the 6 questions ask; answers fill in — 5× *"I don't have that"*, 1 ✓. Score lands **1/6** (amber). Caption: *the same notes were ingested — but the agent only kept work facts.* |
| 3 | **Why** | 20–28 | Right(terminal) shows the **retain mission**: *"Only record professional facts…"* + gloss *"plain-English instructions for what to remember."* Caption: *too narrow → it forgot her home, her dog, her plans.* |
| 4 | **The fix (the loop)** | 28–37 | Right(terminal): `retain mission --feedback "also capture where she lives, pets, preferences, plans, and the reason behind decisions"` → mission rewritten; then `retain apply` (same notes). Caption: **change the mission, not the data.** |
| 5 | **The win (re-eval)** | 37–47 | Right(terminal): eval re-runs. Left(chat): the **same 6 questions** — answers flip ✗→✓ one by one (Austin, Pixel, pottery, Lisbon, oat milk). Score **6/6** (green). Caption: *same questions — now answered.* |
| 6 | **Close** | 47–52 | **1/6 → 6/6.** *You didn't touch the data or the model — you tuned what gets remembered, and your eval proved it.* mission-sandbox · Hindsight. |

## Layout (the split)

Persistent through 2–5:
- **Left — "your assistant"**: a chat bubble column. User question (gray, right-aligned) + assistant
  answer (left). Wrong answers in rose with an ✗; correct in green with a ✓.
- **Right — "the tool"**: a terminal running the real commands; an eval score chip (1/6 → 6/6) that
  recolors amber→green.
- The two move together: the terminal *drives*, the chat *reacts*.

## Open questions for review

1. Lead with the single embarrassing question (pets) in scene 1, or open straight into the eval?
2. Keep all 6 Q&A on screen, or feature 3–4 to breathe?
3. Tone: dev-tool crisp, or a touch more "personal assistant" warmth in the chat copy?
