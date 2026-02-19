# Craft Foundations

Read when: you are setting spacing, padding, radius, depth, and surface treatment rules.

## 4px Grid
- 4px: micro spacing (icon gaps).
- 8px: tight spacing (within components).
- 12px: standard spacing (between related elements).
- 16px: comfortable spacing (section padding).
- 24px: generous spacing (between sections).
- 32px: major separation.

## Symmetrical Padding
- Match top, left, bottom, and right padding by default.
- Break symmetry only when content balance demands it.
- Do it intentionally to create visual interest or hierarchy.

## Border Radius System
- Choose one system and use it everywhere.
- Sharp: 4px, 6px, 8px.
- Soft: 8px, 12px.
- Minimal: 2px, 4px, 6px.
- These are suggested values, adjust based on design needs.

## Depth and Elevation Strategy
Choose one approach and stay consistent.
- Borders-only (flat): clean, technical, dense. Use subtle borders to separate regions.
- Single shadow: soft lift with one shadow layer.
- Layered shadows: richer depth for premium surfaces.
- Surface color shifts: background tints create hierarchy without shadows.
- Elevation change with interaction to give users immediate visual feedback on focus, selection, or hover states.

```css
/* Borders-only */
--border: rgba(0, 0, 0, 0.08);
--border-subtle: rgba(0, 0, 0, 0.05);
border: 0.5px solid var(--border);

/* Single shadow */
--shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

/* Layered shadows */
--shadow-layered:
  0 0 0 0.5px rgba(0, 0, 0, 0.05),
  0 1px 2px rgba(0, 0, 0, 0.04),
  0 2px 4px rgba(0, 0, 0, 0.03),
  0 4px 8px rgba(0, 0, 0, 0.02);
```

## Surface Consistency
- Vary internal card layouts by content.
- Keep surface treatment consistent: border weight, shadow depth, corner radius, padding scale, type hierarchy.
