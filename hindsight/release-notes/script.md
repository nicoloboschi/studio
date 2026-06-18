# release-notes — recurring Hindsight release video

- **Brand:** hindsight · **Composition id:** `hindsight-release-notes` · 1920×1080 · 30fps · ~49s
- **What it is:** a **recurring** template. One video per Hindsight release, same look and rhythm every
  time — only the content (`data.json`) changes.
- **It is NOT a blog-post paraphrase.** For every headline feature we (1) **investigate how it actually
  works in Hindsight** (real API / CLI / config, via the `hindsight-docs` skill + the blog), and
  (2) show a **concrete example that delivers value instantly** — a command and its visible outcome.
- **Story shape:** version hero → one example-driven scene per headline feature → one fast,
  low-animation "everything else" board (the rest of the commits) → upgrade CTA.

## How it's driven

Data-driven: `Video.tsx` is a fixed engine that maps over `data.json`. You regenerate `data.json` from
`capture/build-data.mjs`; you rarely touch `Video.tsx` (only to restyle a layout).

```
capture/build-data.mjs   ← curated, VERIFIED material for one release (edit this)
        │  node hindsight/release-notes/capture/build-data.mjs
        ▼
data.json                ← what the video renders (generated; don't hand-edit)
        │  Video.tsx maps over it
        ▼
hindsight-release-notes
```

Each headline `feature` carries an `example` whose `kind` selects the scene layout:

| `example.kind` | Scene | Use for |
|---|---|---|
| `config-redact` | config code + a before→after transform (redacted spans `[REDACTED:type]` glow; `neutral:true` for a non-alarming input) | policy/transform features (Memory Defense, OCR) |
| `dry-run` | content (once) + N `retain_mission` variants → each variant's facts, new ones flagged | endpoint features whose value is *tuning a param* — paste REAL differential output |
| `curation-actions` | one card per action (e.g. edit vs invalidate), each contrasting before→after | features with distinct verbs to compare |
| `scopes-table` | all modes as a table (mode → built → query it unlocks), one row highlighted, grounded by a real `recall()` | API features where the full option set + *why* matter |
| `ui-shot` | a **real screenshot** framed as a browser window + capability bullets (no mock) | UI/deploy features — capture the live UI |

The `board` is the closing **fast** scene (intentionally minimal animation — a quick fade per row):
two labelled groups (e.g. *providers & models*, *reliability & fixes*) + one `highlight` line.
Per-scene durations live in `Video.tsx` (`FEATURE_FRAMES` + `beats`); the timeline auto-computes.

## Styling — matched to the product

The brand tokens in `hindsight/design.ts` + `DESIGN.md` and the fonts in `src/lib/fonts.ts`
(Inter + JetBrains Mono) are **extracted from the live Hindsight UI** (see capture section) so the
video reads as an extension of the product: bg `#09090B`, code `#141417`, text `#E7E9EE`, blue→teal
brand gradient (`#0074D9 → #009296`), rose `#F0616D`. Editing those tokens restyles every hindsight
video at once.

**Cards = flat shadcn, like the control-plane.** Use the `card(t)` helper (uniform 1px hairline border,
14px radius, soft shadow) and put semantics in a pill `Badge` — **never** a colored left/top bar.
(This replaced the old `borderLeft: 4px solid accent` cards.) Not on Tailwind yet — the look is matched
via tokens; if you want literal shadcn classes, add `@remotion/tailwind-v4` + the product theme vars
and swap `card()`/`Badge` for `className`s.

## Music

Background track wired in `Video.tsx` (`MUSIC_SRC`, `MUSIC_VOL`) with a fade in/out. Files live in
`/public/music` (Mixkit Free License — commercial use, **no attribution required**). Current track:
`placeit-world.mixkit.mp3` (upbeat/energetic). Alternatives downloaded: `techno-fest`, `deep-urban` —
swap by changing the one `MUSIC_SRC` line.

## Cutting the next release (the recurring workflow)

1. Read the new release blog post; list the features.
2. **For each HEADLINE feature, investigate before writing copy** — don't trust the blog's prose alone:
   - Load the `hindsight-docs` skill; grep `references/` (`openapi.json`, `developer/api/*`, `sdks/*`,
     `changelog/index.md`) for the real endpoint / CLI / config / env var.
   - If the feature is newer than the bundled docs, use the blog's verbatim snippet + Hindsight's
     documented API conventions. **Never invent an endpoint or flag.**
   - Choose the `example.kind` that shows value fastest, and fill it with real values + the outcome.
3. Put everything else (smaller features, fixes) into the `board` groups; pick one delightful `highlight`.
4. Edit `capture/build-data.mjs` (version, date, tagline, blogUrl, `features[]`, `board`).
5. (optional) archive: `cp data.json capture/releases/<old-version>.json`.
6. `node hindsight/release-notes/capture/build-data.mjs` → regenerates `data.json`.
7. `npm run studio` → scrub `hindsight-release-notes`; check each scene breathes (no overflow).
8. `npm run render -- hindsight-release-notes out/hindsight-release-notes.mp4`.

## Releases

Each cut overwrites `data.json`; prior cuts are archived under `capture/releases/<version>.json` and
their renders kept as `out/hindsight-release-notes-<version>.mp4`. To re-render an old one, copy its
archived JSON back to `data.json` (or restore that release in `build-data.mjs`).

### Current cut — Hindsight 0.8.3 (June 18, 2026)

Source: <https://hindsight.vectorize.io/blog/2026/06/18/version-0-8-3>

| # | Scene | kind | Verified example (the instant-value moment) |
|---|-------|------|----|
| 1 | **0.8.3** hero | intro | version, tagline, the three headline names |
| 2 | **Dry-Run Fact Extraction** | dry-run | REAL differential from `POST …/dry-run-extract`: same content, `retain_mission` "professional only" → 1 fact vs "+ personal" → 2 facts |
| 3 | **Document OCR** | config-redact (neutral) | the **vision-OCR** knobs (`…MARKITDOWN_OCR_ENABLED/MODEL`); a `receipt.jpg` → extracted text |
| 4 | **Sharper Retrieval** | scopes-table | all `tags_match` modes with **`exact`** highlighted (surfaced in 0.8.3) + 3 `recall()` contrasts; caption adds Chinese-temporal + recency |
| 5 | **Everything else** | board | operational · fixes · **critical** retain-chunking-fix highlight (amber) |
| 6 | **Explore the docs** | outro | `docs.hindsight.vectorize.io` |

Accuracy notes for 0.8.3 (read the **changelog**, not just the blog summary — the blog can over/under-state):
- **Dry-run** value is *tuning*: its request accepts `retain_mission`/`retain_custom_instructions`/
  `retain_extraction_mode` etc., so the scene shows the same content under two missions. Both fact sets
  are the **actual** endpoint output (run live against an isolated 0.8.3 daemon).
- **OCR**: MarkItDown already read PDF/DOCX — the 0.8.3 delta is the OpenAI-compatible **vision** OCR
  path (`…_MARKITDOWN_OCR_*`). Don't frame "OCR" as new.
- `tags_match=exact` is confirmed in the live OpenAPI enum; described definitionally (recall counts not
  asserted — semantic indexing is async). No UI feature this release → no `ui-shot`.

### Prior cut — Hindsight 0.8.2 (June 12, 2026) — archived

`capture/releases/0-8-2.json`. Scenes: Memory Defense (config-redact) · Reversible Curation
(curation-actions) · Observation Scopes (scopes-table) · Local Control Center (ui-shot, real
screenshot) · board (constellation highlight).

## Capturing the control center (real screenshot, not a mock)

The Local Control Center is the **Embed Control Center** at `:7878` (`hindsight-embed control`). It's a
daemon supervisor + config wizard (start/stop the API & control plane, set provider/model/ports, view
logs) — *not* the bank-browsing control plane.

```bash
# control center is token-gated; get the tokened URL
uvx hindsight-embed@latest control start --no-open      # prints http://localhost:7878/?token=…
# screenshot a specific profile's dashboard (?profile=<name>) + extract live CSS tokens
CC_URL="http://localhost:7878/?token=<TOKEN>&profile=desktop" \
  node hindsight/release-notes/capture/control-center-shot.mjs
```

`control-center-shot.mjs` (Playwright, @2x):
- **crops the left PROFILES sidebar** — it lists every local profile (privacy); the crop is derived
  from the main content's left edge, not a magic number.
- writes the screenshot to `public/captures/control-center.png` (used by the `ui-shot` scene).
- also writes `capture/ui-tokens.json` — the **live design tokens** (bg/fg/accent/gradient/fonts/radius)
  pulled from the running UI. That's how `design.ts` + `DESIGN.md` were matched to the product; re-run
  to re-sync after a product restyle.

For a fully isolated capture (no access to your real profiles at all), create a throwaway profile,
seed it, and point `?profile=<that>`:

```bash
uvx hindsight-embed@latest profile create relnotes --port 9100 \
  --env HINDSIGHT_API_LLM_PROVIDER=openai --env HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  --env HINDSIGHT_API_EMBEDDINGS_LOCAL_FORCE_CPU=1 --env HINDSIGHT_API_RERANKER_LOCAL_FORCE_CPU=1
uvx hindsight-embed@latest -p relnotes daemon start
uvx hindsight-embed@latest -p relnotes memory retain demo "Alice is a senior product designer at Lumen Labs…"
# then CC_URL=…&profile=relnotes  node …/control-center-shot.mjs ; daemon stop when done
```

## Notes / accuracy

- **Investigate, don't paraphrase.** Memory Defense, the scope-limit/enumerate API, reversible
  curation, and the constellation export post-date the bundled docs — so their *examples* use the
  blog's verbatim config + Hindsight's verified API conventions, never invented signatures. The
  `observation_scopes` and `recall(tags=...)` calls ARE fully documented and used as-is.
- **Real UI, not a mock.** The control center is a live screenshot (see above). An earlier draft both
  mocked it AND, before that, hallucinated a `docker run` for it — don't do either; capture the real UI.
- **Light on symbols.** Markers are subtle dots, not ✓/✗/▸ glyphs; rely on color + layout.
- **Outro = docs CTA** (`docs.hindsight.vectorize.io`), not a fabricated install line.
- The `code` colorizer in `Video.tsx` is deliberately naive (keys cyan, strings green, booleans amber,
  `#` comments faint, `$ ` prompt green) — keep snippets simple or extend it for other languages.
