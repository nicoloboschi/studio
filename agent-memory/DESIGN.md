# Agent Memory — video design system

The visual language shared by **every short under `agent-memory/`**. This file is the source of
truth; [`design.ts`](./design.ts) is its machine-readable implementation (the `Design` tokens fed to
`<DesignProvider>`). When you change one, change the other.

> These are **vertical social shorts** (9:16, 1080×1920) about *agent memory as a concept* — not about
> any one product. The brand is deliberately distinct from `hindsight/` (which is a calm blue→teal
> product console): this one is **bolder and punchier**, built to read on a phone in a feed.
>
> Vibe: dark, high-contrast, a little electric. One **violet→magenta** gradient does the heavy lifting.
> Big type, generous spacing, one idea per screen, fast enough to hold a thumb.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| `bg` / `bg2` | `#0B0A12` / `#181327` | Background (near-black with a violet radial lift). |
| `panel` | `#16131F` | Cards, lanes, surfaces. |
| `panelBorder` | `#2A2633` | 1px borders / hairlines. |
| `text` | `#F4F2F8` | Primary text. |
| `dim` | `#B5B1C2` | Secondary text, captions. |
| `faint` | `#7C7790` | Labels, chrome, hints. |
| `accent` | `#A78BFA` (violet) | The **brand** + the "with memory" side; hero numbers. |
| `accent2` | `#F472B6` (magenta) | Gradient far end; secondary highlight. |
| `good` / `amber` / `bad` | `#4ADE80` / `#FBBF24` / `#FB7185` | Success / partial / fail. |

**Brand gradient:** `linear-gradient(→, accent → accent2)` = violet→magenta — reserved for the brand
mark and hero numbers (e.g. the speed-up multiple). Don't gradient body text.

## Semantics that carry meaning

- **`accent` (violet)** = *with memory* — the fast, recalled, on-brand side.
- **`bad` (rose)** = *without memory* — the slow side that re-learns everything from scratch.
- **`good` (green)** = a completed task / a win; **`amber`** = partial / in-progress.
- Keep this mapping everywhere so a viewer learns the color code in the first three seconds.

## Type

- **Sans** = **Inter** — all prose: titles, captions, labels. (loaded in `src/lib/fonts.ts`)
- **Mono** = **JetBrains Mono** — anything "machine": clocks, times, counts, kickers, chips.
- Rough scale (1080×1920 vertical): hero `92–120`, scene title `60–72`, body `34–40`,
  task/list `28–32`, labels/kickers `22–26`. Line-height `1.08` for heroes, `1.35` for prose.

## Layout & motion

- Canvas **1080×1920 @ 30fps** (vertical short). Side padding `~64px`.
- Every scene = `<Bg>` + one heading + content, vertically centered or top-weighted.
- Motion is gentle but a touch quicker than the product videos: `Appear` (spring fade+rise) staggered
  by `~8–12` frames; clocks tick; bars/lanes grow with a spring. No hard cuts inside a scene.
- Reuse the shared building blocks in [`../src/lib/components.tsx`](../src/lib/components.tsx)
  (`Bg`, `Appear`, `Typed`, …) and pull every color/font from `useDesign()` — never hard-code, so a
  brand restyle propagates to every short.

## Content principles (for a viewer who knows nothing)

1. Open with the **problem/hook** in the first 2 seconds — a feed scroller decides fast.
2. Define every term inline the first time (one short gloss in `dim`).
3. Use **real or reproducibly-modeled data** (see each short's `capture/`), never invented-on-the-spot
   numbers — commit the script that produced `data.json`.
4. One claim per screen; end on a single memorable result (a number, a ratio).
