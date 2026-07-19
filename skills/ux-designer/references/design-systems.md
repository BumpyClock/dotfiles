# Design Systems

Read when: the brief names a specific design system, or the product is one whose surface has an official system (enterprise SaaS, dashboards, public-sector, Shopify/Atlassian/GitHub product UI).

The brief→package map lives in `production-implementation.md`. This file is the decision (real system vs aesthetic-only), the honesty rule, and the install/docs anchor — the details models get wrong from memory.

## Real system vs aesthetic
A **real design system** has an official package with tokens, components, and accessibility already done. If the brief reads as one of these products, install and use the official package.

An **aesthetic** (glassmorphism, bento, brutalism, editorial, aurora/mesh gradients, kinetic type) has **no official package**. Build it with native CSS + Tailwind + a maintained component library, and label borrowed inspiration honestly in comments.

## Honesty rule (mandatory)
- If the brief maps to an official system, install the **real** package. Do not recreate its CSS by hand. Do not import its tokens and then override 90% of them.
- One system per project. Never mix (no Fluent + Carbon, no shadcn into a Material 3 tree).
- **"Apple Liquid Glass" is Apple-platform only.** There is no official `liquid-glass.css` for the web. Any web version is a `backdrop-filter` + layered-border + highlight approximation — label it as such and ship a `prefers-reduced-transparency` solid-fill fallback.

## Install commands (exact — verify against package.json first)
```bash
# Material Web (Material 3)
npm install @material/web
# Fluent UI React v9
npm install @fluentui/react-components
# Fluent UI Web Components (framework-free)
npm install @fluentui/web-components @fluentui/tokens
# IBM Carbon
npm install @carbon/react @carbon/styles
# Radix Themes
npm install @radix-ui/themes
# shadcn/ui (owned components — never ship default state)
npx shadcn@latest init && npx shadcn@latest add button card badge separator input
# Primer CSS (GitHub product) / Primer Brand (GitHub marketing)
npm install @primer/css        # or: npm install @primer/react-brand
# GOV.UK Frontend / USWDS
npm install govuk-frontend      # or: npm install uswds
# Atlassian (Atlaskit)
yarn add @atlaskit/css-reset @atlaskit/tokens @atlaskit/button @atlaskit/badge @atlaskit/card
# Bootstrap 5.3
npm install bootstrap
# Shopify Polaris web components (Shopify apps only) — no npm install; add to app HTML head:
#   <meta name="shopify-api-key" content="%SHOPIFY_API_KEY%" />
#   <script src="https://cdn.shopify.com/shopifycloud/polaris.js"></script>
```

## Canonical docs (read before reinventing)
- Material Web — https://material-web.dev/theming/material-theming/
- Fluent UI — https://fluent2.microsoft.design/components/web/react/
- Carbon — https://carbondesignsystem.com/developing/react-tutorial/overview/
- Shopify Polaris — https://shopify.dev/docs/api/app-home/web-components
- Atlassian — https://atlassian.design/components / tokens at https://atlassian.design/tokens/design-tokens
- Primer — https://primer.style/
- GOV.UK — https://design-system.service.gov.uk/
- USWDS — https://designsystem.digital.gov/components/
- Radix Themes — https://www.radix-ui.com/themes/docs/components/theme
- shadcn/ui — https://ui.shadcn.com/docs
- Tailwind v4 / dark mode — https://tailwindcss.com/docs/dark-mode
- Apple Liquid Glass (native, not web) — https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
