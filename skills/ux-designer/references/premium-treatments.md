# Premium Treatments

Read when: an agency / Apple-tier / Awwwards read calls for haptic depth and machined detailing (marketing dial VAR ≥ 7, MOTION ≥ 6). These are optional presets, not a house style — reach for one because the design direction earns it, and deviate freely with a stated reason. Nothing here overrides the core references; timing, blur, and layout mechanics still come from `interaction-visual-clarity.md` and `production-implementation.md`.

## Double-Bezel Enclosure (detailed spec)
The nested-enclosure concept and the concentric-radius rule live in `marketing-and-landing.md` and `craft-foundations.md` — don't restate the math, follow it. What this treatment adds is the exact surface detailing that makes a card read as glass-in-a-tray rather than a div-in-a-div:

- **Outer shell**: faint tint (`bg-black/5` light, `bg-white/5` dark), a hairline enclosure (`ring-1 ring-black/5` / `border border-white/10`), snug padding (`p-1.5`–`p-2`), large outer radius.
- **Inner core**: its own distinct surface, plus a top inset highlight so the lip catches light — `shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`. Radius = outer − padding (concentric rule).
- Use only when surfaces sit close (< 24px apart); past that they're separate surfaces per `craft-foundations.md`, and a bezel just looks fussy.

## Button-in-Button Trailing Icon
Extends the Island CTA in `marketing-and-landing.md` with the exact trailing-icon detailing:
- Pill button, generous padding (`px-6 py-3`), `rounded-full`.
- A trailing arrow never sits naked beside the label — nest it in its own circular wrapper (`w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 grid place-items-center`) sitting flush with the button's right inner padding. Reads as a machined control, not a text link.

## Hover Kinetics for Primary CTAs
- Internal tension via `group`: on hover, translate the nested icon circle diagonally (`group-hover:translate-x-0.5 group-hover:-translate-y-px`) and nudge its scale (`scale-105`); on press, scale the whole button (`active:scale-[0.98]`) — press feedback tuning lives in `interaction-visual-clarity.md`.
- True cursor-magnetism (button follows the pointer) is pointer-driven: use motion values, never `useState` per frame — see `production-implementation.md`. Reserve it for one or two hero moments; magnetism on every button reads as gimmick.
- List the properties that transition (`transition-[transform,opacity]`), never `transition-all`.

## Fluid-Island Nav + Hamburger Morph
A floating-pill nav that expands into a full-screen menu — a marketing-moment treatment, not a default:
- **Closed**: navbar detached from the top edge as a glass pill (`mt-6 mx-auto w-max rounded-full`), not glued edge-to-edge.
- **Hamburger → X**: the bars rotate and translate into an X (`rotate-45` / `-rotate-45` with absolute positioning), never a hard swap to a close glyph.
- **Expansion**: a fixed, screen-filling overlay carrying the heavy glass (`backdrop-blur` is fine here — the overlay is fixed, so it doesn't violate the scrolling-container rule).
- **Staggered mask reveal**: links slide up out of an invisible box (`translate-y-8 opacity-0` → `translate-y-0 opacity-100`), sequenced via `staggerChildren` or `animation-delay` per `production-implementation.md`. Tune the per-item delay and duration to product tone — don't hardcode one universal timing.

## Grain / Noise Overlay
An aesthetic layer for the *editorial-luxury* vibe (see `marketing-and-landing.md`) to give surfaces a physical, paper feel — optional, and wrong for clean-tech reads.
- Keep it barely-there: `opacity-[0.03]`.
- Placement mechanic (fixed `inset-0 pointer-events-none` layer, never on scrolling content) is specified in `production-implementation.md` — follow it.
