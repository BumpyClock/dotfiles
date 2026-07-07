# Production Implementation

Read when: implementing a design as production frontend code — building the page/app for real, not just specifying it. Skip for design docs and throwaway mockups.

Existing project stack and conventions always win over these defaults. Verify any dependency exists in `package.json` before importing; if missing, output the install command first.

## Design System Map (brief → official package)
If the brief reads as one of these, install and use the official package — don't recreate its CSS by hand, and don't import its tokens only to override 90%. One system per project; never mix (no Material + shadcn in one tree).

| Brief reads as | Package |
|---|---|
| Microsoft/enterprise SaaS | `@fluentui/react-components` |
| Material-flavored product | `@material/web` + M3 tokens |
| IBM-style B2B analytics | `@carbon/react` + `@carbon/styles` |
| Shopify app surfaces | Polaris (required for Shopify admin) |
| Atlassian-style product | `@atlaskit/*` + `@atlaskit/tokens` |
| GitHub-style devtool | `@primer/css` / `@primer/react-brand` |
| UK public sector | `govuk-frontend` (regulatorily expected) |
| US public sector | `uswds` |
| Modern accessible React base | `@radix-ui/themes` |
| Modern SaaS, owned components | shadcn/ui (`npx shadcn@latest init && npx shadcn@latest add ...`) — never ship default state: customize radii, colors, shadows, type |
| Indie/small-team marketing | Tailwind v4 utilities + `dark:` |

Aesthetics are not systems: glassmorphism, bento, brutalism, editorial, aurora gradients have no official package — build with native CSS/Tailwind and label borrowed inspiration honestly. "Apple Liquid Glass" on the web is an approximation (`backdrop-filter` + layered borders + highlights); label it as such and provide a `prefers-reduced-transparency` solid fallback.

## Stack Defaults (greenfield)
- **Framework**: React/Next.js, Server Components by default. Providers and anything using Motion, scroll, or pointer physics is an isolated `'use client'` leaf; RSC renders static layout.
- **Styling**: Tailwind v4 (use `@tailwindcss/postcss` or the Vite plugin, not the old `tailwindcss` postcss plugin).
- **Animation**: Motion — `import { motion } from "motion/react"` (not the legacy `framer-motion` path). GSAP + ScrollTrigger only for pin/scrub scrolltelling. Three.js for canvas/3D. Never mix GSAP/Three with Motion in one component tree — they fight over frames.
- **Fonts**: `next/font` or self-hosted `@font-face` with `font-display: swap`. No Google Fonts `<link>` in production.
- **Icons**: one family, priority `@phosphor-icons/react`, `hugeicons-react`, `@radix-ui/react-icons`, `@tabler/icons-react`; `lucide-react` only on request or existing dependency. Standardize `strokeWidth` globally. Never hand-roll SVG icon paths.
- **State**: local `useState`/`useReducer`; Zustand/Jotai/context only for real prop-drilling pain. **Never `useState` for continuous input-driven values** (mouse, scroll, magnetic hover) — it re-renders the tree per frame; use `useMotionValue`/`useTransform`/`useScroll`.

## Layout Mechanics
- Breakpoints: `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`. Contain pages with `max-w-7xl mx-auto` (or ~1400px).
- `min-h-[100dvh]`, never `h-screen`, for full-height sections (iOS Safari address bar).
- CSS Grid over flexbox percentage math (`grid-cols-1 md:grid-cols-3 gap-6`, not `w-[calc(33%-1rem)]`).
- Asymmetric layouts collapse explicitly below 768px: single column, `w-full px-4`, rotations and negative-margin overlaps removed (touch-target conflicts). Declare the mobile fallback in the same component.
- Forms: label above input, error below, no placeholder-as-label. Full state cycle always: loading (skeletons matching final layout shape, not spinners), empty (composed, shows how to populate), error (inline for forms, toast only for transient).

## Motion Code Rules
Banned outright:
- `window.addEventListener('scroll', ...)` and `window.scrollY` in React state — reflows/re-renders per frame. Use `useScroll()`, ScrollTrigger, IntersectionObserver, or CSS scroll-driven animations.
- `requestAnimationFrame` loops touching React state — motion values instead.
- Animating `top/left/width/height` — transform and opacity only. `will-change: transform` sparingly, only on actively animating elements.
- `backdrop-blur` on scrolling containers — fixed/sticky elements only. Grain/noise overlays on a `fixed inset-0 pointer-events-none` layer only.

Required:
- Every `useEffect` animation has strict cleanup (`ctx.revert()` for GSAP contexts).
- `useReducedMotion()` / `@media (prefers-reduced-motion: reduce)` gates everything beyond hover states; loops, parallax, scroll-hijack collapse to static.
- Motion's `layout`/`layoutId` for visible state changes only — not wrapped around static content "for safety".
- Staggers via `staggerChildren` (parent + children in the same client tree) or `animation-delay: calc(var(--index) * 80ms)`.

### Scroll-reveal stagger (default — no pinning needed)
```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```
Use for feature lists, testimonial grids, logo walls. Save GSAP for actual pin/scrub work.

### GSAP sticky-stack (cards pin and stack on scroll)
```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top", // pin at viewport top — "top center"/"top 80%" causes the half-scroll misfire
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: { trigger: cardEls[i + 1], start: "top bottom", end: "top top", scrub: true },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div key={i} className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center">
          {card}
        </div>
      ))}
    </div>
  );
}
```
Every card except the last pins; the NEXT card's trigger drives the previous card's shrink.

### GSAP horizontal pan (vertical scroll → horizontal travel)
```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top", // pin before animating, or the user sees half a slide
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">{children}</div>
    </section>
  );
}
```

## Dark Mode Tokens
Dual-mode by default for consumer-facing pages; test both before finishing. Pick ONE strategy per project: Tailwind `dark:` variants everywhere, or semantic CSS variables (`--surface`, `--text-primary`, `--accent`) swapped under `[data-theme="dark"]` / `prefers-color-scheme`. Set theme once at the root; sections never override. No pure `#000`/`#fff`. Hierarchy and brand accent survive both modes at WCAG AA.

## Performance Gate
- LCP < 2.5s (hero image `priority`/preloaded), INP < 200ms, CLS < 0.1 (reserve space for images/fonts/embeds). Run Lighthouse before calling a page done.
- Lazy-load below-the-fold heavy deps (Motion isn't tiny; Three.js is large).
- Z-index discipline: systemic layers only (nav, modal, overlay, grain), documented in a constants file — no scattered `z-50`/`z-[9999]`.
