# LLM-Bench — video design system

The visual language for **every video under `llm-bench/`** — fun, energetic benchmark animations for
local LLM evals. This file is the source of truth; [`design.ts`](./design.ts) implements it.

> Vibe: a **data terminal**. Deep slate, a warm/cool **amber↔azure** duotone, monospaced numbers, a cool
> geometric display face. Cool and nerdy but **minimal and professional** — no neon, no arcade, no emojis.
> Bars still *race* and numbers still *count up*, but the look is restrained: hairlines, lots of negative
> space, one warm color vs one cool color.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| `bg` / `bg2` | `#0C0E12` / `#12151B` | Deep slate background (+ a faint cool lift). |
| `panel` | `#161A21` | Cards, blocks, rows. |
| `panelBorder` | `#262C36` | 1px hairlines. |
| `text` | `#E8EBF0` | Primary text + names. |
| `dim` | `#98A2B0` | Secondary text. |
| `faint` | `#5A6472` | Labels, axis marks. |
| `accent` | `#E8B563` (amber) | **Model A / warm side**; hero numbers. |
| `accent2` | `#5BA8F0` (azure) | **Model B / cool side**. |
| `good` / `amber` / `bad` | `#6FCF97` / `#E8B563` / `#E5707E` | pass / caution / fail. |

**Head-to-head pair:** amber (A) vs azure (B) — warm vs cool, the core duotone. **Racer colors** (multi-model
leaderboard): amber `#E8B563`, azure `#5BA8F0`, emerald `#6FCF97`, iris `#A98BF0`, coral `#E58A6A`.
**Medals:** gold `#E8B563`, silver `#C2C9D2`, bronze `#C08457`.

## Type

- **Display/sans** = **Space Grotesk** — model names, titles (cool, geometric, a little technical).
- **Mono** = **IBM Plex Mono** — every number, label, and axis tick. The data is monospaced; names are not.
- Scale (1080×1920): hero/score `56–72`, name `40–46`, metric number `28–34`, axis/label `22–26` (mono,
  lowercase or small-caps, generous letter-spacing).

## Motion

- Canvas **1080×1920 @ 30fps** (vertical). Numbers **count up**; bars **race** to a thin finish line;
  rows reveal in sequence. Winners are marked with a small uppercase `WIN`, not a trophy. No glows or
  confetti — keep it calm and exact. Let whitespace and the warm/cool split do the work.

## Conventions

- **Composition id** = `<brand>-<video>` (e.g. `llm-bench-local-speed`).
- **Real data**, captured under the video's `capture/` → `data.json`. The video maps over it; no hardcoded
  numbers in `Video.tsx`.
