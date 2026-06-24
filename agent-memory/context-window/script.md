# context-window — "a bigger window isn't memory" short

- **Brand:** agent-memory · **Composition id:** `agent-memory-context-window` · **1080×1920 (9:16)** · 30fps · ~23s
- **Pairs with:** tweet 4 in `../why-memory/tweets.md` ("a bigger window isn't memory").
- **Story (concrete, no abstraction):** a dev tells their agent facts over one long session. The context
  window has a fixed capacity; as new messages arrive the oldest scroll out — including the one that
  mattered. A question that depends on it gets answered **wrong**. Then a memory system lifts that fact
  out of the window and keeps it, so the same question is answered **right**.

## Beats

| # | Scene | ~frames | What happens |
|---|-------|---------|--------------|
| 1 | **Fill & forget** | 0–300 | Title *"A bigger window just delays the problem."* The **context window** panel fills with dev notes; the first note *"we're on Postgres, not MySQL"* (violet, highlighted) scrolls out the top as the bar hits **FULL** (amber). Q: *"what migration tool should I use?"* → **✗ "Use Flyway with your MySQL setup."** Caption: *the earliest facts scroll out.* |
| 2 | **Memory keeps it** | 300–585 | Same fill, but a **memory** pill (*DB: Postgres ✓ kept*) sits above the window. The note still scrolls out of the window — but memory already kept it. Same Q → **✓ "Use a Postgres tool — golang-migrate or Atlas."** Caption: *memory already kept it.* |
| 3 | **Close** | 585–690 | *A bigger context window **isn't memory.*** Context is finite; memory curates what matters and keeps it. · agent memory |

## The data (`data.json`, built by `capture/build-data.mjs`)

The scenario: `messages[]` (index 0 is the key fact), `capacity` (how many fit before truncation),
`memory` (the distilled fact), `question`, `answerWrong`, `answerRight`. Illustrative but concrete —
edit and re-run to recut.

## Re-generating

```bash
node agent-memory/context-window/capture/build-data.mjs
npm run render -- agent-memory-context-window out/agent-memory-context-window.mp4
```

The window mechanic is data-driven: change `capacity` or the message list and the fill/truncation
timing follows. `START`/`STEP` in `Video.tsx` tune how fast messages stream in.
