# Redesign Protocol

Read when: redesigning an existing site or page (not a greenfield build).

Misclassifying the mode is the biggest source of bad redesign output. Detect the mode first, audit before touching anything, then apply the smallest set of levers that satisfies the brief.

## Detect the mode (first action)
- **Preserve** — modernise without breaking the brand. Audit, extract brand tokens, evolve gradually. Dials: match the existing site, MOTION +1.
- **Overhaul** — new visual language over existing content. Treat visuals as greenfield; preserve content and IA. Dials: VARIANCE +2, MOTION +2, DENSITY match.
- **Greenfield** — the brand itself is changing. No preservation constraints.

If ambiguous, ask once: "Preserve the existing brand, or start visually from scratch?"

## Audit before touching
Document current state before proposing changes:
- **Brand tokens** — primary/accent colors, type stack, logo treatment, radii. Extract these *before* applying any palette/type default; a brand that is already purple stays purple.
- **Information architecture** — page tree, primary nav, conversion paths.
- **Content blocks** — what exists, what's doing work, what's filler.
- **Keep vs retire** — preserve signature interactions, recognisable hero, copy voice; retire AI-slop tells, broken layouts, dead links, perf traps.
- **Dial reading of the existing site** — infer its current VARIANCE/MOTION/DENSITY. That is your starting point, not the skill baseline.
- **SEO baseline** — ranking pages, meta titles, structured data, OG cards. **SEO migration is the #1 redesign risk.**

## What never changes silently
Never modify without explicit user approval — each breaks SEO, analytics, autofill, or muscle memory:
- URL structure / route slugs, anchor IDs
- Primary nav labels
- Form field names or order
- Brand logo or wordmark
- Existing legal / consent / cookie copy

Also: don't rewrite copy voice (visual modernisation ≠ content rewrite), don't regress existing accessibility wins (focus states, alt text, keyboard nav, contrast), don't rename anything downstream tracking depends on.

## Modernisation levers (priority order)
Apply in order; stop when the brief is satisfied. Higher levers give more visual lift per unit of risk.
1. **Typography refresh** — biggest lift per unit of risk.
2. **Spacing & rhythm** — section padding, vertical rhythm.
3. **Color recalibration** — desaturate, unify neutrals, keep the brand accent.
4. **Motion layer** — add dial-appropriate micro-interactions to existing components.
5. **Hero & key-section recomposition** — restructure top-of-funnel.
6. **Full block replacement** — only when a block is unsalvageable.

## Targeted evolution vs full redesign
- IA, content, and SEO are sound → **targeted evolution** (levers 1-4). ~70% of the value at ~40% of the risk. Default here.
- Visual debt is structural (broken IA, no design system, broken mobile) → **full redesign** with strict content preservation.
- Brand itself is changing → **greenfield**.
