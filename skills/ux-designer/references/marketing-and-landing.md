# Marketing and Landing Surfaces

Read when: designing landing pages, portfolios, marketing sites, or premium consumer-facing pages.

Scope: hero-led scrolling pages built for first impressions and conversion. Not dashboards, data tables, or multi-step product UI — those use the core references only. This file layers marketing-specific rules on top; run `anti-slop-tells.md` alongside it.

## Design Read (required first step)
Before specifying anything, state one line in the design doc:

> "Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<aesthetic family>."

Infer from: page kind, vibe words the user used, linked references, audience, existing brand assets, and quiet constraints (regulated industry, accessibility-first, public sector — these override aesthetic preference). If the read genuinely diverges, ask exactly one clarifying question; otherwise declare and proceed.

## Three Dials
Set after the design read; record values + reasoning in the doc. Every layout/motion/density choice downstream is gated by them.

- `DESIGN_VARIANCE` (1 = strict symmetry, 10 = asymmetric/artsy)
- `MOTION_INTENSITY` (1 = static, 10 = cinematic physics)
- `VISUAL_DENSITY` (1 = art gallery, 10 = cockpit)

| Read | VAR | MOT | DEN |
|---|---|---|---|
| Minimalist / calm / Linear-style | 5-6 | 3-4 | 2-3 |
| Premium consumer / Apple-y / luxury | 7-8 | 5-7 | 3-4 |
| Agency / experimental / Awwwards | 9-10 | 8-10 | 3-4 |
| SaaS landing (default) | 7 | 6 | 4 |
| Developer portfolio | 6 | 5 | 4 |
| Editorial / blog | 6 | 4 | 3 |
| Trust-first / public sector / regulated | 3-4 | 2-3 | 4-5 |
| Redesign: preserve existing | match existing | +1 | match |

Redesigns: audit first (brand tokens, IA, patterns to keep vs retire); never silently change URLs, nav labels, form fields, or logo.

## Hero Discipline
- Hero fits the first viewport: headline ≤ 2 lines, subtext ≤ 20 words, primary CTA visible without scroll. Overflow means the font scale or the copy is wrong, never the rule.
- Max 4 text elements: (eyebrow OR brand strip, not both) + headline + subtext + CTAs (1 primary, ≤ 1 secondary). Trust strips, taglines under CTAs, pricing teasers, avatar rows all move to sections below.
- Plan font scale and asset size together: `text-6xl`+ equivalents only for 3-5 word headlines; a 4-line headline is a font-size error.
- Top padding cap ≈ 96px desktop; more reads as a layout bug.
- Hero needs a real visual. Text + gradient blob is a placeholder, not a hero.
- Composition: left-text/right-image and centered-over-mesh are the overused defaults. Alternatives — centered over full-bleed image (text in lower 40%), bottom-left over image, top-left lead, stacked center, image-as-canvas with safe-area text, off-grid editorial offset, inverted classic. Pick deliberately.
- Hero scale, choose one decisively: **Giant statement** (massive type, dominant viewport) / **Mid editorial** (balanced, cinematic) / **Mini minimalist** (small logo + short statement + thin CTA, mostly negative space — restraint, not weakness).
- Logo wall lives under the hero, never inside it.

## Section Rhythm
- Each section has a job: hook / proof / educate / convert. Default section shape: headline ≤ 8 words + sub ≤ 25 words + one visual or CTA.
- Vary composition anchor and background mode across the page; at least 3 different anchors sitewide, never the same anchor 3× in a row. Background modes: solid + inline asset, texture/paper, full-bleed image + tonal overlay, editorial side-image, flat color block + detail crop, tonal gradient, duotone image, color-blocked diptych.
- Pace the scroll: lighter → richer → calmer. Mix section ambition — some large art-directed, some mini and mostly negative space.
- Long lists (> 5 items) get a different component, not a longer list: grouped chunks, card grid, tabs, scroll-snap pills, carousel. Spec tables with a hairline under every row are the laziest default.
- Data-dumps (20-row tables, giant pricing matrices) belong on their own page; show top 3-5 + link.
- Bento: exact cell count, background diversity, rhythm (see anti-slop reference).
- Backgrounds are a tool, not a risk: don't retreat to all-white surfaces, and don't let every section share one mode.

## Premium Surface Treatments
For premium/agency/consumer reads (dial VAR ≥ 7). Cross-reference `craft-foundations.md` for radius math.

- **Macro whitespace**: section padding ~96-160px vertical. Let the page breathe heavily.
- **Nested enclosure (double-bezel)**: hero cards and feature containers as machined hardware — outer shell (subtle tint bg, hairline border, 6-8px padding, large radius ~32px) wrapping an inner core (own surface, inset top highlight, radius = outer − padding per concentric rule).
- **Island CTA**: fully-rounded pill, generous padding; a trailing arrow/icon sits in its own small circular wrapper flush with the inner edge (button-in-button), not naked beside the text.
- **Eyebrow tags**: pill badge, ~10px uppercase, wide tracking — rationed per anti-slop rules (≤ 1 per 3 sections).
- **Vibe archetypes** (pick one, commit): *Ethereal glass* — near-black OLED base, subtle radial color orbs, blurred panels with white/10 hairlines, wide grotesk. *Editorial luxury* — warm cream/espresso, high-contrast display type, faint film-grain overlay. *Soft structuralism* — white/silver base, massive bold grotesk, floating elements with ultra-diffuse ambient shadows. *Editorial minimalism* — see `design-direction.md`.
- **Gradient discipline**: palette-matched low-chroma tonal grades, single-hue atmospheric washes, soft vignettes — allowed and confident. Mesh blobs, purple-blue AI defaults, neon halos, gradient text — banned as defaults.

## Motion Choreography
Spec motion in the doc; timings from `interaction-visual-clarity.md` still apply to product UI — these are marketing-moment rules:

- Custom cubic-bezier curves for hero moments (e.g. `cubic-bezier(0.16, 1, 0.3, 1)`, 600-800ms); plain `linear`/`ease-in-out` reads cheap on marketing pages.
- Scroll-entry reveals: fade-up (~16px) + slight blur resolving, staggered ~60-100ms per item, once per element. Elements should not pop in statically at MOTION ≥ 5.
- Staggered mask reveals for nav/menu overlays; magnetic or press-scale hover physics for primary CTAs at MOTION ≥ 6.
- Every animation must be motivated in one sentence: hierarchy, storytelling, feedback, or state transition. "Looks cool" fails.
- Motion claimed = motion shown: if the doc sets MOTION ≥ 5, the mockup demonstrates at least hero entry + one scroll reveal + CTA hover, or lower the dial.
- Hard specs: honor `prefers-reduced-motion` (collapse loops/parallax to static); animate transform/opacity only; blur effects on fixed/sticky elements only, never scrolling containers.

## Imagery
Landing pages are visual products; text-only is incomplete work, not minimalism.

- Priority: (1) generated section-specific images when an image tool is available, (2) seeded placeholders (`https://picsum.photos/seed/{descriptive-seed}/{w}/{h}`) or provided brand assets, (3) clearly-labeled TODO slots with dimensions — never div-built fake screenshots or hand-rolled illustration filler.
- Even restrained briefs need 2-3 real images (hero, one product/lifestyle, one supporting).
- Treat images as brand material: one consistent grade/treatment sitewide, tonally matched to the palette, overlays/scrims wherever text sits on imagery.
- Logo walls: real SVG marks (e.g. Simple Icons); invented brands get a simple generated monogram, not a styled text span.

## CTA Rules
- One label per intent, reused verbatim across nav/hero/footer.
- Label fits one line at desktop (≤ 3 words primary).
- WCAG AA contrast against its background, including ghost buttons over photos (add scrim or stroke).
- Vary CTA style across the page (pill, ghost, inline arrow link, full-width banner) while keeping the primary action unmistakable.

## Mockup Delivery
The standard HTML mockup rules in SKILL.md apply. Additionally, across a multi-section mockup enforce one brand world: same palette and accent logic, same type scale, same radius language, same image treatment, same CTA family. A reader scrolling the mockup must never feel the design system drift.
