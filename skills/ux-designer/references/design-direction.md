# Design Direction

Read when: you need to choose or revise the overall aesthetic direction for a product or feature.

## Context Questions
- What does the product do?
- Who uses it?
- What is the emotional job (trust, efficiency, delight, focus)?
- What would make it memorable?

## Personality Options
- Precision and density: tight spacing, monochrome, information-forward. Good for power users. Examples: Linear, Raycast, terminal aesthetics.
- Warmth and approachability: generous spacing, soft shadows, friendly colors. Good for collaborative tools. Examples: Notion, Coda.
- Sophistication and trust: cool tones, layered depth, financial gravitas. Good for money or sensitive data. Examples: Stripe, Mercury.
- Boldness and clarity: high contrast, dramatic negative space, confident type. Good for decisive modern products. Examples: Vercel, minimal dashboards.
- Utility and function: muted palette, functional density, clear hierarchy. Good for developer tools. Example: GitHub.
- Data and analysis: chart-optimized, technical but accessible, numbers as first-class citizens.

Pick one or blend two, but commit to a direction that fits the product.

For marketing/landing surfaces, also state a one-line design read and set the three dials — see `marketing-and-landing.md`.

## Named Aesthetic Recipes
Fuller starting points when the direction calls for them (vibe archetypes for marketing pages live in `marketing-and-landing.md`):

**Editorial minimalism** (workspace/document tools, calm SaaS — Notion-adjacent):
- Canvas: white or warm bone (`#F7F6F3` / `#FBFBFA`); surfaces white/near-white (`#F9F9F8`); structural borders ultra-light (`#EAEAEA` / `rgba(0,0,0,0.06)`).
- Text: off-black (`#111` or `#2F3437`), secondary muted gray (`#787774`); body line-height 1.6.
- Type: characterful sans for UI/body; an editorial serif (chosen per `anti-slop-tells.md` — not Fraunces/Instrument Serif) reserved for hero headings and quotes with tight tracking (-0.02em to -0.04em) and line-height ~1.1; monospace for code, keys, metadata.
- Accents: washed-out pastels only, for tags/inline-code/icon chips — pale red `#FDEBEC`/`#9F2F2D`, blue `#E1F3FE`/`#1F6C9F`, green `#EDF3EC`/`#346538`, yellow `#FBF3DB`/`#956400`.
- Components: flat 1px-bordered cards, crisp 8-12px radius, generous internal padding; solid near-black CTAs with 4-6px radius and no shadow; pill tags in pastels; accordions as border-bottom rows with `+`/`−` toggles; `<kbd>`-style keystroke chips.
- No gradients, no heavy shadows (< 0.05 opacity if any), no pill-shaped large containers. Depth comes from subtle low-opacity ambient imagery or faint radial warmth, not elevation.

## Color Foundation
**Don't default to warm neutrals.** Consider the product:

- **Warm foundations** (creams, warm grays) — approachable, comfortable, human
- **Cool foundations** (slate, blue-gray) — professional, trustworthy, serious
- **Pure neutrals** (true grays, black/white) — minimal, bold, technical
- **Tinted foundations** (slight color cast) — distinctive, memorable, branded

**Light or dark?** Dark modes aren't just light modes inverted. Dark feels technical, focused, premium. Light feels open, approachable, clean. Choose based on context.

**Accent color** — Pick ONE that means something. Blue for trust. Green for growth. Orange for energy. Violet for creativity. Don't just reach for the same accent every time.

### Choose a Layout Approach

The content should drive the layout:

- **Dense grids** for information-heavy interfaces where users scan and compare
- **Generous spacing** for focused tasks where users need to concentrate
- **Sidebar navigation** for multi-section apps with many destinations
- **Top navigation** for simpler tools with fewer sections
- **Split panels** for list-detail patterns where context matters
- **Full-screen layouts** for immersive experiences where users need to focus
- **Responsive layouts** for adaptable experiences across devices
- **Floating panels** for contextual actions or additional information

### Choose Typography

Typography sets tone. Don't always default:

- **System fonts** — fast, native, invisible (good for native apps, existing design systems, and utility-focused products)
- **Geometric sans** (Geist, Inter) — modern, clean, technical
- **Humanist sans** (SF Pro, Satoshi) — warmer, more approachable
- **Characterful display sans** (Cabinet Grotesk, Clash Display, PP Neue Montreal, GT Walsheim, Söhne) — brand-forward marketing and premium consumer surfaces
- **Editorial serif** (Tiempos, Canela, GT Sectra, Domaine, Reckless) — only when genuinely editorial/luxury/publication and you can say why this serif fits this brand; not the reflex for "creative/premium" (see `anti-slop-tells.md`)
- **Monospace influence** — technical, developer-focused, data-heavy

Pairings that work: Geist + Geist Mono, Satoshi + JetBrains Mono, Cabinet Grotesk + Inter Tight. Emphasize within a headline using italic/bold of the same family, never a second family.
