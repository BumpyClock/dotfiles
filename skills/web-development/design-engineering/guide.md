---
name: design-engineering
description: Language-agnostic design engineering principles and patterns for building polished, accessible web interfaces. Use when building or reviewing UI components, implementing forms, handling touch interactions, designing motion, optimizing perceived quality, or creating marketing pages.
---

# Design Engineering

Language-agnostic guide for polished, accessible web interfaces.

## Workflow
- Start here for general web UI work before reaching for framework-specific guidance.
- Reuse existing tokens, components, and primitives before inventing new ones.
- Route to `animations.md` for motion work and `PRACTICAL-TIPS.md` for concrete fixes.
- Keep guidance portable across HTML, CSS, JS, TS, React, and other web stacks.

## Quick Reference

| Category | When to Use |
| --- | --- |
| [Animations](animations.md) | Enter/exit transitions, easing, springs, performance |
| [Practical Motion Tips](PRACTICAL-TIPS.md) | Concrete animation fixes, hover issues, touch hitboxes |
| [UI Polish](ui-polish.md) | Typography, visual design, layout, colors |
| [Aesthetic Direction](aesthetic-direction.md) | Visual direction, differentiation, anti-patterns |
| [Forms & Controls](forms-controls.md) | Inputs, buttons, form submission |
| [Touch & Accessibility](touch-accessibility.md) | Mobile, touch devices, keyboard nav, a11y |
| [Component Design](component-design.md) | Compound components, composition, props API |
| [Marketing](marketing.md) | Landing pages, blogs, docs sites |
| [Performance](performance.md) | Virtualization, preloading, optimization |

## Core Principles

### 1. No Layout Shift

Dynamic elements should cause no layout shift. Use hardcoded dimensions, `font-variant-numeric: tabular-nums` for changing numbers, and avoid font weight changes on hover or selected states.

### 2. Touch-First, Hover-Enhanced

Design for touch first, then add hover enhancements. Disable hover effects on touch devices. Ensure 44px minimum tap targets. Never rely on hover for core functionality.

### 3. Keyboard Navigation

Tabbing should work consistently. Only allow tabbing through visible elements. Ensure keyboard navigation scrolls elements into view with `scrollIntoView()`.

### 4. Accessibility by Default

Every animation needs `prefers-reduced-motion` support. Every icon button needs an aria label. Every interactive element needs proper focus states.

### 5. Speed Over Delight

Product UI should be fast and purposeful. Skip animations for frequently-used interactions. Marketing pages can be more elaborate.

## Decision Flowcharts

### Should I Animate This?

```text
Will users see this 100+ times daily?
|- Yes -> Don't animate
\- No
   |- Is this user-initiated?
   |  \- Yes -> Animate with ease-out (150-250ms)
   \- Is this a page transition?
      \- Yes -> Animate (300-400ms max)
```

### What Easing Should I Use?

```text
Is the element entering or exiting?
|- Yes -> ease-out
\- No
   |- Is it moving on screen?
   |  \- Yes -> ease-in-out
   \- Is it a hover/color change?
      |- Yes -> ease
      \- Default -> ease-out
```

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| `transition: all` | Specify exact properties |
| Hover effects on touch | Use `@media (hover: hover)` |
| Font weight change on hover | Use consistent weights |
| Animating `height` or `width` | Use `transform` and `opacity` only |
| No reduced motion support | Add `prefers-reduced-motion` query |
| `z-index: 9999` | Use a fixed scale or `isolation: isolate` |
| Custom page scrollbars | Only customize scrollbars in small elements |

## Review Checklist

When reviewing UI code, check:

- [ ] No layout shift on dynamic content
- [ ] Animations have reduced motion support
- [ ] Touch targets are 44px minimum
- [ ] Hover effects disabled on touch devices
- [ ] Keyboard navigation works properly
- [ ] Icon buttons have aria labels
- [ ] Forms submit with Enter/Cmd+Enter
- [ ] Inputs are 16px+ to prevent iOS zoom
- [ ] No `transition: all`
- [ ] `z-index` uses a fixed scale

## Reference Files

For detailed guidance on specific topics:

- [animations.md](animations.md) - Easing, timing, springs, performance
- [PRACTICAL-TIPS.md](PRACTICAL-TIPS.md) - Concrete animation fixes and implementation patterns
- [ui-polish.md](ui-polish.md) - Typography, shadows, gradients, scrollbars
- [aesthetic-direction.md](aesthetic-direction.md) - Aesthetic direction, differentiation, anti-patterns
- [forms-controls.md](forms-controls.md) - Inputs, buttons, form patterns
- [touch-accessibility.md](touch-accessibility.md) - Touch devices, keyboard nav, a11y
- [component-design.md](component-design.md) - Compound components, composition, props API
- [marketing.md](marketing.md) - Landing pages, blogs, docs
- [performance.md](performance.md) - Virtualization, preloading, optimization
