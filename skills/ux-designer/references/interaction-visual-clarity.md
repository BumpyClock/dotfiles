# Interaction and Visual Clarity

Read when: you are defining motion, contrast, color usage, navigation context, or dark mode behavior.

## Animation
Timings and curves below are proven defaults — tune to product tone, keep consistent once chosen:
- 150ms for micro-interactions, 200 to 250ms for larger transitions.
- Easing: cubic-bezier(0.25, 1, 0.5, 1).
- Avoid spring or bouncy motion in enterprise UI; springs can fit playful consumer products.
- Use interruptible transitions for interactive state changes: hover, press, toggle, open/close, selected/unselected.
- Use keyframes only for staged sequences that run once: page enter, loading, onboarding reveal.
- Never specify `transition: all`; list only properties that change.
- Use `will-change` sparingly, only after first-frame stutter is observed, and only for compositor-friendly properties like transform, opacity, or filter.
- Animate transform and opacity only; never layout properties (top, left, width, height).
- Honor `prefers-reduced-motion`: loops, parallax, and scroll-driven motion collapse to static/instant. Spec the reduced variant, don't leave it implied.
- Backdrop blur belongs on fixed/sticky elements (navbars, overlays) only — never on scrolling containers or large content areas.
- Marketing-page motion (scroll reveals, staggered entrances, hover physics) has its own rules in `marketing-and-landing.md`.
- Auditing existing motion in a codebase is the `improve-animations` skill's job; its `AUDIT.md` carries the fuller rule catalog (frequency→severity, per-component easing/duration tables) and is the single source for those values.

## Enter and Exit Motion
- Split enter animations into semantic chunks: title, description, controls, data rows, or cards.
- Stagger chunks by about 100ms; title words can use about 80ms when the moment deserves attention.
- Combine opacity, small vertical movement, and light blur for enter motion when it fits the product tone.
- Make exit motion subtler and shorter than enter motion.
- Prefer small fixed exit movement, such as -12px, over moving an element by its full height unless spatial context matters.

## Contextual Icon Motion
- Animate icons that appear, disappear, or swap due to state: copy -> copied, play -> pause, favorite -> favorited.
- Use opacity, scale, and blur together so the icon feels responsive instead of toggled.
- Use scale from 0.25 to 1, blur from 4px to 0, and opacity from 0 to 1 for icon swaps.
- Avoid animating static nav icons, purely decorative icons, or icon labels.

## Press Feedback
- Use subtle press scale for tactile controls when it fits the product.
- Scale 0.96 is a good default; smaller than 0.95 feels exaggerated.
- Provide a static/no-motion variant for controls where scale would distract.

## Contrast Hierarchy
- Use four levels: foreground, secondary, muted, faint.
- Apply the system consistently across text, icons, and borders.

## Color for Meaning Only
- Use gray for structure and hierarchy.
- Use color only for status, action, error, or success.
- Prefer typography and spacing over extra color in data-heavy UI.

## Navigation Context
- Provide navigation context so screens feel grounded.
- Include one or more of: navigation, location indicator, user or workspace context.
- For sidebars, consider the same background as main content with a subtle border.

## Dark Mode
- Prefer borders over shadows for separation.
- Adjust semantic colors to avoid harshness on dark backgrounds.
- Keep the same hierarchy system with inverted values.

## Anti-Patterns
Usually wrong — break one only with a stated reason tied to the design direction:
- Dramatic drop shadows.
- Large radius (16px or more) on small elements.
- Asymmetric padding without reason.
- Pure white cards on colored backgrounds.
- Thick borders (2px or more) for decoration.
- Excessive spacing in product UI (margins over 48px between sections; marketing/landing pages follow the macro-whitespace rules in `marketing-and-landing.md` instead).
- Bouncy animations.
- Decorative gradients.
- Multiple accent colors in one interface.

## Always Question
- Did I choose a direction or default?
- Does the direction fit the users and context?
- Does every element feel crafted?
- Is the depth strategy consistent?
- Is everything aligned to the grid?

## The Standard
Design every interface as if a team obsesses over 1px differences. Aim for intricate minimalism with context-driven personality.
