# DataDein Styleguide — Reference for coding agents

> **For AI agents:** this file is the source of truth for DataDein's visual identity.
> When asked to do a style-related task (colors, fonts, spacing, tone), read this file
> and `design-tokens.json` first rather than inventing values. `design-tokens.css`
> contains the same values as ready-to-use CSS custom properties matching this
> project's `--dd-*` naming convention.
>
> Converted from: `DataDein-Styleguide.pdf` (v1.0, 2025), produced by Voir Visual Agency.

---

## 1. Brand summary

DataDein helps businesses optimize their finances and workflows — automation, data
analysis, VAT/tax reporting, and strategic financial advice, delivered via cloud-based
tools and tailored solutions.

**Core words (kerneord):** Innovation · Effektivitet · Datasikkerhed ·
Skræddersyede løsninger · Troværdighed

**Tone:** professional, modern, trustworthy, calm-but-active. Not playful, not corporate-cold.

---

## 2. Color palette

### Primary colors (neutral base)

| Name | Hex | RGB | Suggested role |
|---|---|---|---|
| Beton | `#B2B9BC` | 178, 185, 188 | Light neutral surface, secondary text on dark |
| Stålgrå | `#7A8389` | 122, 131, 137 | Mid neutral, borders, muted UI elements |
| Lava | `#3A4043` | 58, 64, 67 | Dark neutral, near-black text alternative |

### Secondary colors

| Name | Hex | RGB | Suggested role |
|---|---|---|---|
| Hvid | `#FFFFFF` | 255, 255, 255 | Card/surface background |
| Sky | `#F8F8F8` | 248, 248, 248 | Page background |
| Himmel | `#DEE4E6` | 222, 228, 230 | Borders, dividers, subtle fills |
| Hav | `#A2B0B6` | 162, 176, 182 | Secondary surface / muted accent |
| Sten | `#545D62` | 84, 93, 98 | Muted / secondary text |
| Havbund | `#132531` | 19, 37, 49 | Primary text ("ink"), darkest brand color |
| Marine | `#4F829B` | 79, 130, 155 | **Primary accent** — links, active states, primary chart color |
| Energi | `#FB5707` | 251, 87, 7 | **Highlight accent** — the one saturated color in the palette. Use sparingly: CTAs, key deltas, selected states. Not a general chart color. |

**Rule from the styleguide:** colors must not resemble each other too closely —
maintain clear contrast between light and dark shades for legibility and a
professional look. Combine light and dark neutrals deliberately rather than using
mid-tones against mid-tones.

**Practical guidance for dashboards/charts:** treat Marine as the default primary
series color, Sten/Hav/Himmel/Stålgrå as secondary series or neutral bars, and
reserve Energi for the one thing per view that should visually pop (a budget
overrun, a selected bar, a primary CTA button). Don't build a 6-color chart palette
purely from Energi + Marine + neutrals — there isn't enough hue variety in this
palette for that; lean on value/contrast (light vs. dark) to differentiate series,
and treat Energi as an exception color, not a rotation color.

---

## 3. Typography

| Role | Font | Source | Weights used | Usage |
|---|---|---|---|---|
| Primary | **Kanit** | Google Fonts | Regular | Large titles and key headings **only**. Not for body copy or long text. |
| Secondary | **Titilium Web** | Google Fonts | Regular, SemiBold | Body copy, longer text passages, secondary headings (SemiBold for those). |

Practical mapping for the dashboard:
- Page title / section titles (`Title`, `h1`) → Kanit
- Card labels, metrics, body text, chart labels → Titilium Web Regular
- Card sub-headings / emphasized labels → Titilium Web SemiBold

---

## 4. Logo usage

Assets: primary logo (wordmark + figure), color variations (for contrast on
different backgrounds), and a standalone "logo figure" (icon-only mark) for use as
a favicon or in small/detail contexts where the full wordmark isn't needed.

**Correct use:**
- On a dark background (e.g. Havbund) with a light/white logo variant
- On a mid-grey background with appropriate contrast variant
- On a light-grey background with a dark logo variant
- Always with adequate contrast between logo and background

**Incorrect use — avoid:**
- Placing the logo on a busy photo or textured background
- Insufficient contrast between logo and background (e.g. dark-on-dark, similar mid-tones)
- Distorting, skewing, or stretching the logo
- Recoloring the logo outside its defined variants
- Crowding the logo — it needs respectful clear space from headings, images, and
  other graphic elements
- Placing it directly next to another brand's logo

---

## 5. Imagery style

- Muted, professional tones: primarily grey and blue neutrals, with an occasional
  warm accent.
- Clean lines, symmetry, and a sense of depth.
- Movement/blur used deliberately for dynamism — including blurring people in the
  background of a shot to anonymize them.
- Overall mood balances calm and activity: signals professionalism and innovation
  rather than being either sterile or busy.

---

## 6. Applying this to the dashboard project

- Font stack in `index.css` should load **Kanit** and **Titilium Web** (e.g. via
  `@fontsource/kanit` and `@fontsource/titillium-web`), replacing the current
  placeholder fonts (Sora / IBM Plex Mono).
- Tremor chart `colors` props need a custom Tailwind color scale (Tremor only
  accepts registered Tailwind color names, not raw hex) mapping to Marine, Energi,
  Sten, Hav, Himmel — see `design-tokens.json` for the exact hex values to register.
- CSS variables in `design-tokens.css` are named to slot directly into this
  project's existing `--dd-*` convention in `index.css`.
