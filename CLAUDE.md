# CLAUDE.md — how to make videos in this studio

This repo is a **video studio**: branded explainer/demo videos built with [Remotion](https://remotion.dev)
(videos = React components rendered to MP4). Read this before creating or editing a video.

## Structure

```
studio/
├── CLAUDE.md                  # this file — the workflow
├── package.json               # remotion + scripts (studio / render / compositions)
├── src/
│   ├── index.ts               # registerRoot
│   ├── Root.tsx               # registers EVERY video as a <Composition>
│   └── lib/
│       ├── design.tsx         # Design type + <DesignProvider> + useDesign()
│       └── components.tsx     # shared on-brand primitives (Bg, SceneTitle, Typed, …)
└── <brand>/                   # one folder per brand, e.g. hindsight/
    ├── DESIGN.md              # the brand's visual system (source of truth)
    ├── design.ts             # the Design tokens implementing DESIGN.md
    └── <video>/              # one folder per video, e.g. mission-sandbox/
        ├── script.md         # the script (beats + on-screen copy + how to regen)
        ├── Video.tsx         # the Remotion composition
        ├── data.json         # real data the video shows
        └── capture/          # script(s) that PRODUCED data.json (keep it reproducible)
```

**Two levels of folder, exactly as the names suggest:** a **brand** (`hindsight/`) owns the look; a
**video** (`hindsight/mission-sandbox/`) is one deliverable. Everything inside a brand folder follows
that brand's `DESIGN.md`.

## How the design system works

- Each brand has a **`DESIGN.md`** (human: palette, type, motion, conventions) and a **`design.ts`**
  (machine: a `Design` token object). They must stay in sync — `DESIGN.md` is the source of truth.
- A video wraps its scenes in `<DesignProvider design={brand}>`. Shared components in
  `src/lib/components.tsx` read tokens via `useDesign()`, so they're automatically on-brand.
- **To restyle every video in a brand**, edit `DESIGN.md` + `design.ts` once. Don't hard-code colors
  or fonts in a `Video.tsx` — pull from `useDesign()` (`const t = useDesign()` → `t.accent`, `t.mono`, …).

## Making a new video

1. **Pick/create the brand.** New brand → make `<brand>/DESIGN.md` + `<brand>/design.ts` (copy
   `hindsight/` as a template) and define its look. Existing brand → **read its `DESIGN.md` first.**
2. **Create the video folder** `<brand>/<video>/` and write **`script.md`**: the beats (a table of
   scene · frames · what it says), the on-screen copy, the data source, and a "re-generating" section.
   Plan the story for someone who knows nothing: open with the **problem**, gloss every term inline,
   one claim per screen, end on one memorable result.
3. **Get real data.** Prefer real output over invented copy. Put the script that produces it in
   `capture/` and commit the resulting `data.json` so renders are reproducible without re-running it.
4. **Build `Video.tsx`** from the shared components. Compose scenes with `<Sequence from durationInFrames>`;
   each scene = `<Bg>` + a `<SceneTitle>` + content; animate with `Appear` / `Typed` / springy meters.
   Export the component **and** a `*Meta` (`{ id, durationInFrames, fps, width, height }`); id = `<brand>-<video>`.
5. **Register it** in `src/Root.tsx` (add a `<Composition>` using the exported meta).
6. **Preview**: `npm run studio` → opens the Remotion studio in a browser; scrub/iterate live.
7. **Render**: `npm run render -- <brand>-<video> out/<brand>-<video>.mp4`.

## Commands

```bash
npm install                                              # first time
npm run studio                                           # live browser preview (best for iterating)
npm run compositions                                     # list registered videos
npm run gallery                                           # render all videos + open a play-only browser gallery; each card shows its absolute .mp4 path (click to copy)
#   flags: -- --force (re-render all) · --no-open (don't launch browser)
npm run render:1v1 -- qwen3.5-2b gemma-3-4b              # llm-bench 1v1 template → X-ready out/1v1_<A>_vs_<B>_square.mp4 (add --vertical for 9:16)
npm run render -- hindsight-mission-sandbox out/hindsight-mission-sandbox.mp4
```

Defaults: 1920×1080 @ 30fps, H.264 MP4. `out/` and `*.mp4` are gitignored — commit the *source*, not
the rendered video.

## Conventions

- **Composition id** = `<brand>-<video>`.
- **Real data**, captured reproducibly under the video's `capture/`. No lorem ipsum.
- **No hard-coded styling** in videos — only `useDesign()` tokens + shared components, so a brand
  restyle propagates everywhere.
- **Story first**: problem → concept → demo → one-line result. Define jargon the first time it appears.
- Keep each scene to one idea; gentle motion only (fade/rise/typing/grow), no hard cuts mid-scene.

## Current content

- **hindsight/** — Hindsight (agent memory). Design: dark engineering-console, indigo→cyan gradient.
  - **mission-sandbox/** — demo of tuning a "retain mission" and watching golden coverage go 3/8 → 8/8
    on real Gemini extraction. See its `script.md`.
  - **release-notes/** — **recurring** per-release video. Data-driven: `capture/build-data.mjs` digests
    one release blog post → `data.json`, and `Video.tsx` maps over it (intro → feature scenes → grouped
    lists → "one more thing" → upgrade CTA). To cut the next release, edit `build-data.mjs` and re-render —
    see its `script.md`. Currently loaded with **0.8.3**; prior cuts archived under `capture/releases/`.

- **agent-memory/** — **vertical social shorts (9:16, 1080×1920)** about *agent memory as a concept*,
  not any one product. Distinct brand from hindsight/: bolder, high-contrast, violet→magenta gradient.
  - **time-to-solve/** — a **6s seamless loop**: two balls bounce left↔right — *agentic search* on files
    (rose, slow, re-reads files every query) vs a *memory system* (violet, **10× faster**, one recall).
    The speed axis only. Multiple is **real cited data** in `data.json` (`capture/build-data.mjs`): memory
    recall ≈0.2s on LoCoMo (Mem0) vs multi-step agentic retrieval ~seconds → conservative 10×. `script.md`.
  - **context-window/** — **"a bigger window isn't memory"** short (~23s). A context window fills with dev
    notes; the key fact (*Postgres, not MySQL*) scrolls out → agent answers wrong; a memory pill keeps the
    fact → same question answered right. Concrete, data-driven (`data.json`). `script.md`.
  - **etch-a-sketch/ · leaky-bucket/ · sandcastle/ · snowball/** — **wordless 5s hook loops** (no text):
    forgetting (etch wipes), RAM-not-storage (leaky vs sealed bucket), durability (wave vs stone castle),
    compounding (melting vs growing snowball). Tweet copy lives outside the video.

- **llm-bench/** — **fun benchmark animations for local-LLM evals.** Arcade leaderboard / drag-race look:
  dark track, neon lime→cyan, big mono scoreboard numbers. See `DESIGN.md`.
  - **local-speed/** — ~25s: 5 models **race** on peak tok/s (numbers count up, checkered finish) →
    **leaderboard** with single/peak/prefill/schema → close on the fastest. Data-driven from
    `capture/build-data.mjs` → `data.json`; add a model and it slots into both scenes. `script.md`.
  - **head-to-head/** — **reusable 1v1 template.** Fast round-by-round match (single · parallelism ·
    prefill · structured-output · size), each round its own metric viz; persistent scorebar with model
    **icons** (`public/icons/<family>.png`, dot fallback). Two responsive comps: `…-head-to-head` (9:16)
    and `…-head-to-head-x` (1:1 for X). Retarget any pair + export X-ready, model-named MP4 with
    **`npm run render:1v1 -- <modelA> <modelB>`** — reads the **`vendor/localmaxxing` submodule**
    (`results/models/*.json`). See `script.md`.
