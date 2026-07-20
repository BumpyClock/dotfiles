# Anti-Slop Tells

Read when: running the final pass on any mockup or visual spec; writing placeholder content; designing marketing or consumer-facing surfaces.

These are patterns that mark a design as AI-generated. Each is banned as a *default* — override only with a stated reason tied to the design direction (a brand that is genuinely purple stays purple).

## Color Tells
- AI purple/violet-on-white, purple-to-blue glows, mesh/rainbow gradient blobs, neon edges.
- Premium-consumer autopilot palette: warm cream/bone background + brass/clay/oxblood accent + espresso near-black text. It is the reflex for every cookware/wellness/artisan/luxury brief. Rotate instead: cold luxury (silver/chrome/smoke), forest (deep green/bone/amber), black-and-tan, cobalt+cream, terracotta+slate, monochrome + one saturated pop.
- Multiple accent colors, or an accent that changes mid-page. One accent, locked page-wide.
- Theme flip mid-page: a light warm-paper section inside a dark page (or vice versa). One theme per page; same-family background tints are fine.
- Pure `#000000` / `#FFFFFF`. Use off-black and off-white.

## Typography Tells
- Serif-by-default for anything "creative/premium". Serif needs explicit justification: brand names a serif, or genuinely editorial/luxury/publication/heritage. Everything else defaults to a characterful sans display.
- Inter/Roboto/system-default chosen by inertia on brand-forward marketing surfaces. Legitimate for native apps, utility tools, and projects already using them — a tell only when the surface is meant to carry brand personality and the font was never chosen.
- Fraunces and Instrument Serif: the two LLM-favorite display serifs. Avoid as defaults even when serif is justified.
- Mixed-family emphasis: a serif word dropped into a sans headline for "visual interest". Emphasize with italic or bold of the same family.
- Gradient text as a shortcut for "premium".
- Italic display words with descenders (`y g j p q`) clipped by `leading-none`. Spec `line-height: 1.1` minimum plus bottom reserve.
- Giant headline + weak tiny subcopy; all-caps everywhere; awkward forced line breaks (`for thirty<br><em>years.</em>`).

## Layout Tells
- Centered hero over dark mesh gradient — the LLM default opening. Left-text/right-image split is the second-most overused; neither should be reflexive (see marketing reference for alternatives).
- Three identical feature cards in a row.
- Split-header: giant left headline + small explainer paragraph floating top-right. Stack vertically instead.
- Zigzag fatigue: 3+ consecutive image/text alternating sections. Cap at 2, then break the pattern.
- Same layout family reused across sections. A page with 8 sections needs at least 4 distinct layout families.
- Eyebrow spam: small uppercase tracked label above *every* section heading. Ration to at most 1 per 3 sections; the headline alone is usually enough. Mechanical check: count `uppercase tracking` labels.
- Bento grids with empty filler cells, or all-white text-only cells. N items → N cells; 2-3 cells need real visual variation (image, tint, pattern).
- Hairline dividers on every row of a long list or spec table. Group into chunks or use a different component.
- Marquees: maximum one per page.
- Scoring/progress bars with filled background tracks as landing-page comparison visuals.
- Hero that overflows the first viewport: headline over 2 lines, subtext over 20 words, or the primary CTA pushed below the fold. Cut copy or reduce scale until the CTA is visible without scrolling. A 4-line hero headline is a font-size error, not a copy-length one.
- Hero content floating halfway down the page from excess top padding (`pt-32`+). Cap hero top padding at ~`pt-24`; earn breathing room with font/asset scale, not padding.
- Overstuffed hero stack: tagline under the CTAs, trust micro-strip, pricing teaser, or avatar row crammed into the hero. Max 4 text elements (eyebrow OR brand strip, headline, subtext, CTAs); everything else moves to a section below. The "Used by / Trusted by" logo wall lives under the hero, never inside it.
- Nav that wraps to two lines, or a tall "agency" bar eating the viewport. One line at desktop, height ≤ 80px (default 64-72px); condense labels or collapse to a hamburger before wrapping.

## Content and Copy Tells
Placeholder content must be realistic — these break the illusion:
- Generic names ("John Doe", "Sarah Chan") and egg avatars. Use locale-appropriate realistic names.
- Startup-slop brands: Acme, Nexus, Flowbit, NovaCore, Quantumly. Invent names that sound real.
- Fake-perfect numbers (`99.99%`, `50%`, `1234567`) and fake-precise specs (`4.1×`, `5.8 mm`) with no source. Use organic messy data or label as mock.
- Fake scarcity counters (`Reservation 412 of 800`, `3 spots left`) as decoration. Only with a real limited-run waitlist and real data.
- Filler verbs: elevate, seamless, unleash, next-gen, revolutionize, transformative. Concrete verbs only.
- Copy self-audit before delivery: re-read every visible string; rewrite anything grammatically broken, referent-free, or LLM-poetic ("elegant nothing" phrasing). Plain beats cute.
- Quotes: max 3 lines, real typographic quotes or none, attribution = name + role (never name alone).
- Em-dash (`—`) as a visible design flourish in mockup copy — headlines, eyebrows, pills, captions, attribution. The #1 copy tell. Restructure with period, comma, or colon.
- Middle-dot (`·`) chains as universal separator. Max one per metadata line.

## Decoration Tells
- Section-number eyebrows (`00 / INDEX`, `001 · Capabilities`) and `01 / 4` pagination labels.
- Version labels in the hero (`V0.6`, `BETA`, `EARLY ACCESS`) unless the brief is a launch; version footers (`v1.4.2`, `Build 0048`) on marketing pages.
- Locale/weather/time strips (`LIS 14:23 · 18°C`) unless the brief is genuinely place- or timezone-driven.
- Scroll cues (`↓ Scroll to explore`). The user knows what scroll is.
- Poetic section labels ("From the field", "On our desks", "Loose plates") and mock-humble copy ("Quietly trusted by"). Plain labels: "Testimonials", "Latest writing".
- Pills/tags overlaid on images (`PLATE · BRAND`); fake photo-credit captions (`Field study no. 12 · Ines Caetano`). Caption below the image, functional, or nothing.
- Decoration strips at hero bottom (`DESIGN · BUILD · SHIP`); rotated vertical text; crosshair/hairline grid lines as pure decoration.
- Decorative colored status dots on nav items, list rows, badges. Dots only for real semantic state, sparingly.
- Generic step labels ("Step 1 / Step 2 / Phase 01"). The verb is the label: "Install", "Configure", "Ship".
- Micro-meta sentences under section headings ("The list will stay short on purpose.").

## Fake Artifact Tells
- Div-built fake screenshots: fake dashboards, task lists, terminals assembled from styled rectangles. Use real screenshots, generated images, a real mini-component, or nothing.
- Hand-rolled decorative SVG illustrations. Icon libraries for icons; real/generated imagery for visuals; a simple geometric monogram is the only safe hand-rolled mark.
- Logo walls as plain text wordmarks, or logos with redundant category labels underneath ("Stripe — payments"). Real SVG marks, logo only.
- Duplicate CTA intent: "Get in touch" + "Let's talk" + "Reach out" on one page. One label per intent, reused everywhere.

## Mechanical Pre-Delivery Check
Scan the mockup/spec for: em-dashes in visible copy; eyebrow count > ceil(sections/3) — count by role (any small uppercase/tracked/small-caps label above a heading, however it's styled); accent color drift; radius system drift; theme flip mid-page; CTA labels that wrap or duplicate intent; button/form text below WCAG AA contrast; hero CTA below the fold; hero top padding beyond ~`pt-24`; hero stack over 4 text elements; nav wrapping to 2 lines or taller than 80px at desktop; any tell above without a stated override reason.
