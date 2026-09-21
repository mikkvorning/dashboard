# DataDein Dashboard — Roadmap (14–30 Sept 2026)

**Budget:** 13 workdays × ~2 focused hours ≈ 26 hours total.
**Committed scope:** the dashboard page, fully styled, packaged for WordPress/Elementor.
**Cut unless time allows:** front-page teaser, cross-chart filtering, drill-down detail views, timeline range beyond the existing 1Y/3Y/ALL tabs.

If a day's box doesn't get checked, don't try to "catch up" by doubling the next day — just shift the cut list further down. The packaging/handoff work in Week 3 is non-negotiable; everything else is negotiable.

---

## Week 1 (14–18 Sept): Apply the style guide

- [ ] **Mon 14 — Fonts.** Swap `Sora` / `IBM Plex Mono` → `Kanit` (headings/titles only, per styleguide — not for long text) + `Titilium Web` (body, secondary headings). Install `@fontsource/kanit` and `@fontsource/titillium-web`, update `index.css` imports and `.dd-title`/`.dd-mono` rules.
- [ ] **Tue 15 — Color tokens.** Replace the placeholder `--dd-ink` / `--dd-muted` / `--dd-page` variables in `index.css` with the real palette:
  - Ink → **Havbund** `#132531`
  - Muted text → **Sten** `#545D62`
  - Page background → **Sky** `#F8F8F8` / **Hvid** `#FFFFFF`
  - Primary accent (charts, links, active states) → **Marine** `#4F829B`
  - Highlight/CTA accent (use sparingly — it's the one saturated color in the palette) → **Energi** `#FB5707`
  - Neutral surfaces/borders → **Beton** `#B2B9BC`, **Himmel** `#DEE4E6`, **Hav** `#A2B0B6`
- [ ] **Wed 16 — Tremor color mapping (the fiddly one, budget the full 2h).** Tremor's `colors={[...]}` props only accept registered Tailwind color names, not raw hex. Add a small custom scale to `tailwind.config` (e.g. `datadein-marine`, `datadein-energi`, `datadein-sten` with generated shade steps) so the charts can reference brand colors instead of the current stock `cyan/teal/amber/blue/indigo/rose/sky/violet/emerald`.
- [ ] **Thu 17 — Apply it.** Swap every chart's `colors` prop to the new brand set. Also fix the `KontoMap6` donut chart to drop the `"x"` / `0`-value slice before rendering — it's a data-cleanup artifact, not a real category.
- [ ] **Fri 18 — Visual QA pass #1.** Check contrast/spacing feels like the styleguide, test at mobile width.

**✅ Milestone:** dashboard is visually on-brand, no more default Tremor teal/cyan anywhere.

---

## Week 2 (21–25 Sept): Polish, then start packaging

- [ ] **Mon 21 — Copy pass.** A few labels read ambiguously — e.g. "Samlet beløb (Realiseret)" showing a negative number for the ALL range reads as a net result across both revenue and cost lines, not a total. Reword for clarity ("Nettoresultat" or similar). Spot-check da-DK number formatting.
- [ ] **Tue 22 — Decide on the selection interaction, don't over-build it.** Right now clicking a bar sets a "focus" badge but doesn't filter the other charts — that's honestly fine and low-risk for your time budget. Keep it as-is unless Tuesday finishes early; don't start real cross-filtering unless you have a spare day banked.
- [ ] **Wed 23 — Loading/empty/error states.** Add a lightweight transition/skeleton when switching range tabs (you already have the `dd-grid-enter` animation — reuse it), confirm the error banner reads well.
- [ ] **Thu 24 — Start packaging.** Set up the Vite single-file build output (`vite-plugin-singlefile` or lib mode) so the app compiles to JS/CSS that mounts into a bare `<div id="datadein-dashboard-root">` with no dev-server assumptions.
- [ ] **Fri 25 — Embed test on staging.** Drop the built bundle into an actual Elementor HTML widget on your staging site. This is where Tailwind's base reset fighting the theme's CSS would show up — apply scoping/prefixing now if it does, not later.

**✅ Milestone:** dashboard is visually final and proven to actually embed cleanly in the real environment.

---

## Week 3 (28–30 Sept): Harden + hand off

- [ ] **Mon 28 — Full staging test.** Real page, real theme around it, mobile view, all three range tabs, page refresh, and confirm the `data/*.json` fetch paths resolve correctly relative to wherever the page actually lives (not just your local dev path).
- [ ] **Tue 29 — Write the handoff package.** A short README covering: exact Elementor steps (which widget, where the script/style tags go), which files must be uploaded together, how to swap in new data JSON later, and known limitations (no live data, no cross-filtering, etc.). Zip it all up.
- [ ] **Wed 30 — Delivery day.** Do one final smoke test from the zip file itself — not your dev environment — so you're testing what the other developer will actually receive. Deliver.

---

## What's explicitly cut (revisit only if a week finishes early)
- Front-page teaser section
- Cross-chart filtering (clicking a bar actually filtering the other charts)
- Drill-down detail views (FormålsNr/KontoNr level)
- "Expand timeline" beyond the current 1Y/3Y/ALL tabs
