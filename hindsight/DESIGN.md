# Hindsight — video design system

The visual language shared by **every video under `hindsight/`**. This file is the source of
truth; [`design.ts`](./design.ts) is its machine-readable implementation (the `Design` tokens fed to
`<DesignProvider>`). When you change one, change the other.

> Vibe: calm, technical, trustworthy. Dark "engineering console" aesthetic — like looking at a clean
> terminal at night. Let whitespace and one accent gradient do the work; never more than one idea per
> screen.
>
> **These tokens mirror the real Hindsight product UI** (the Embed Control Center / Control Plane),
> extracted live from its CSS so videos read as an *extension of the product*, not a separate brand.
> When the product restyles, re-extract with `release-notes/capture/control-center-shot.mjs` (it writes
> `ui-tokens.json`) and update this file + `design.ts` together.

## Palette (matched to the product)

| Token | Hex | Use |
|-------|-----|-----|
| `bg` / `bg2` | `#09090B` / `#15151A` | Page background (product near-black + faint radial lift). |
| `panel` | `#141417` | Cards, code blocks, terminal bodies (product code surface). |
| `panelBorder` | `#27272A` | 1px borders / hairlines (zinc-800). |
| `text` | `#E7E9EE` | Primary text (product foreground). |
| `dim` | `#A1A1AA` | Secondary text, captions (zinc-400). |
| `faint` | `#71717A` | Labels, chrome, hints (zinc-500). |
| `accent` | `#3396E8` (blue) | Product/brand, links, kickers' partner, code keys. |
| `accent2` | `#00A6A6` (teal) | Secondary highlight, kickers, the brand gradient's far end. |
| `good` / `amber` / `bad` | `#34D399` / `#FBBF24` / `#F0616D` | Success / partial / fail (`bad` = product destructive). |

**Brand gradient:** `linear-gradient(→, accent → accent2)` = the product's blue→teal
(`#0074D9 → #009296`) — reserved for the product name and hero numbers only. Don't gradient body text.

## Type (the product's fonts)

- **Sans** = **Inter** — all prose: titles, captions, fact text. (loaded in `src/lib/fonts.ts`)
- **Mono** = **JetBrains Mono** — anything "machine": terminal, commands, numbers, kickers, code, chips.
- Rough scale (1920×1080): hero `96–120`, scene title `50`, body/sub `30–36`, fact/list `25–29`,
  labels/kickers `20–26`. Line-height `1.1` for heroes, `1.4–1.5` for prose.

## Layout & motion

- Canvas **1920×1080 @ 30fps**. Side padding `~80–130px`.
- Every scene = `<Bg>` + one `<SceneTitle kicker title>` (mono uppercase kicker + big title), then content.
- Motion is gentle: `Appear` (spring fade+rise) staggered by `~12–18` frames; `Typed` for terminal
  commands (~40 cps); meters/bars grow with a spring. No hard cuts inside a scene, no bounce/spin.
- Reusable building blocks live in [`../src/lib/components.tsx`](../src/lib/components.tsx):
  `Bg`, `SceneTitle`, `Appear`, `Typed`, `TerminalWindow`, `CoverageMeter`, `GoldenRow`, `FactCard`,
  `Chip`. Prefer these over bespoke styling so videos stay on-brand.

## Conventions that carry meaning

- **Terminal window** = "what the system actually does" (real commands, real output).
- **Green ✓ / amber / rose ✗** = covered / partial / missing — keep this mapping everywhere.
- **`accent` (indigo)** always marks the product/brand; **`accent2` (cyan)** marks the current focus.
- Captions are one sentence, `dim`, centered under the content — they state the takeaway in plain English.

## Content principles (for a viewer who knows nothing)

1. Open with the **problem**, not the product. Earn the "why" before the "how".
2. Define every term inline the first time (one short gloss in `dim`).
3. Use **real data** wherever possible (see each video's `capture/`), never lorem ipsum.
4. One claim per screen; end on a single memorable result.
