# Interaction and Visual Clarity

Read when: you are defining motion, contrast, color usage, navigation context, or dark mode behavior.

## Animation
- 150ms for micro-interactions, 200 to 250ms for larger transitions.
- Easing: cubic-bezier(0.25, 1, 0.5, 1).
- Avoid spring or bouncy motion in enterprise UI.

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
- Dramatic drop shadows.
- Large radius (16px or more) on small elements.
- Asymmetric padding without reason.
- Pure white cards on colored backgrounds.
- Thick borders (2px or more) for decoration.
- Excessive spacing (margins over 48px between sections).
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
