# Aesthetic Direction

Guidance for setting a distinctive visual direction and avoiding generic UI outcomes.

## Design Thinking

Before coding, lock a clear, intentional direction:

- Purpose: What problem does this interface solve and who uses it?
- Tone: Choose a clear aesthetic (brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian).
- Constraints: Framework, performance, accessibility, and platform limits.
- Differentiation: What is the one thing someone will remember?

## Commit to a Clear Direction

CRITICAL: Pick a single conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work. The key is intentionality, not intensity.

## Design System Alignment

Prefer existing design tokens and components when they exist:

- Audit the project for tokens (CSS variables, theme files, Tailwind config, tokens JSON) and reusable components.
- Reuse existing tokens and components as-is. Avoid inventing new ones unless requirements demand it.
- Discovery heuristics: search for `tokens.*`, `theme.*`, `tailwind.config.*`, `:root` CSS vars, `design-system/`, `ui/`, `components/`, Storybook config, or linked design docs.
- If no design system exists, define a minimal token set (color roles, typography scale, spacing, radius, shadows, motion) and build reusable base components before composing the page.
- Centralize new styles in tokens and components to prevent one-off styling.

## Aesthetic Guidelines

### Typography

Choose fonts that are beautiful, unique, and interesting. Avoid generic stacks like Arial and Inter. Pair a distinctive display font with a refined body font. Prefer existing type tokens and scales, and define them when absent.

### Color and Theme

Commit to a cohesive palette. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly distributed palettes. Reuse existing color tokens, and define roles and tokens when absent.

### Motion

Use animation for high-impact moments and micro-interactions. For HTML, prefer CSS-only solutions. For React, use Motion libraries when available. A single, well-orchestrated page-load sequence with staggered reveals (via `animation-delay`) creates more delight than scattered micro-interactions. Follow existing design-engineering guidance on motion, and avoid scroll-triggered animations on marketing pages.

### Spatial Composition

Embrace unexpected layouts: asymmetry, overlap, diagonal flow, grid-breaking elements, generous negative space, or controlled density.

### Backgrounds and Visual Details

Create atmosphere and depth rather than defaulting to solid colors. Use gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, or subtle grain overlays when they support the chosen aesthetic.

## Anti-Patterns to Avoid

- Generic AI aesthetics: cookie-cutter layouts and predictable component patterns.
- Overused font families and stacks (Arial, Inter, Roboto, system fonts).
- Cliched color schemes, especially purple gradients on white backgrounds.
- Converging on trendy defaults across outputs (for example, Space Grotesk everywhere).
- Indistinct visual direction that does not match the context.

## Match Complexity to Vision

IMPORTANT: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive effects and animation. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

## Reminder

Commit fully to a distinctive vision and execute it consistently.
