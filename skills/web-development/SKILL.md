---
name: web-development
description: Build, refactor, review, debug, polish, and verify modern web apps and interfaces. Use when work involves frontend UI, HTML, CSS, JavaScript, TypeScript, React, Next.js, design systems, accessibility, forms, motion, responsive behavior, performance, or React-specific diagnostics such as react-doctor.
---

# Web Development

## Workflow
- Classify request first: UI/design, component implementation, React app work, motion, forms/accessibility, or performance/verification.
- Open only the most relevant nested guide first and pull deeper references from there as needed.
- Keep design guidance framework-agnostic unless the request is clearly React-specific.
- Prefer existing design systems, platform APIs, framework features, and browser-native behavior over custom wrappers.
- Keep behavior stable unless the user asked for a behavior change.

## Core Rules
- Reuse existing tokens, components, and primitives before inventing new ones.
- Accessibility by default: semantic HTML, keyboard navigation, focus states, reduced motion, and appropriate touch targets.
- Prefer fast, purposeful UI over decorative motion in product surfaces.
- Fix root cause, not visual band-aids.
- Use React-specific diagnostics only when the stack is React.
- This parent skill is the only live trigger. Nested guides are documentation, not standalone skills.

## Guide Index
- `design-engineering/guide.md` -> language-agnostic UI design engineering, polish, forms, accessibility, touch, marketing, and performance guidance.
- `design-engineering/animations.md` -> motion rules, easing, timing, spring guidance, performance, and reduced-motion guidance.
- `design-engineering/PRACTICAL-TIPS.md` -> concrete animation implementation patterns and fixes.
- `react/guide.md` -> React and Next.js implementation and review guidance.
- `react/react-doctor.md` -> when and how to run `react-doctor`, plus how to interpret findings.

## Common Stacks
- UI polish: `design-engineering/guide.md`
- Motion work: `design-engineering/animations.md` + `design-engineering/PRACTICAL-TIPS.md`
- Forms/accessibility/mobile: `design-engineering/forms-controls.md` + `design-engineering/touch-accessibility.md`
- Marketing pages: `design-engineering/marketing.md` + `design-engineering/aesthetic-direction.md`
- React feature or bug work: `react/guide.md`
- React verification pass: `react/guide.md` + `react/react-doctor.md`
