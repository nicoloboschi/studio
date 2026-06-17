# studio

Branded explainer/demo videos, built with [Remotion](https://remotion.dev) — one folder per video.

```
<brand>/                 # owns the look (DESIGN.md + design.ts)
  <video>/               # one deliverable (script.md + Video.tsx + real data)
```

Each **brand** folder (e.g. [`hindsight/`](./hindsight)) has a `DESIGN.md` design system that every
video inside it follows. Each **video** folder has a markdown `script.md`, the Remotion composition,
and the real data it shows (reproducible via its `capture/`).

## Quick start

```bash
npm install
npm run studio          # live preview in the browser
npm run render -- hindsight-mission-sandbox out/hindsight-mission-sandbox.mp4
```

See [`CLAUDE.md`](./CLAUDE.md) for the full workflow (how to add a brand or a video).

## Videos

| Brand | Video | What it shows |
|-------|-------|---------------|
| hindsight | [mission-sandbox](./hindsight/mission-sandbox) | Tuning a "retain mission" lifts golden coverage 3/8 → 8/8 (real Gemini extraction). |
