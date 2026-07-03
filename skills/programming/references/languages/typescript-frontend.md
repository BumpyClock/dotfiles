# TypeScript and Frontend (React/Next.js)

**Load when:** repo contains TypeScript or React/Next.js code. Match the framework and library versions in `package.json`; check installed versions before reaching for newer APIs (Server Components, Actions, etc.).

## TypeScript

- Strict compiler settings; rely on inference where the type is clear.
- Type-safe boundaries: explicit types at module/API edges, inference inside.
- Prefer explicit unions, `undefined`, or result-like types over ambient `null`; pass `null` only when the contract requires it.
- Prefer interfaces or type aliases at boundaries; composition over implementation inheritance; modules and functions before classes.
- Favor immutable data and explicit state transitions; avoid getter/setter-heavy anemic models.
- Avoid utility classes and hidden static state; prefer pure module functions or factories.
- Avoid runtime introspection of object internals when discriminants, schemas, or type guards are clearer.
- Document public interfaces, exported types, hooks, and components with TSDoc when behavior is not obvious.

## React / Next.js

- Component architecture: clear boundaries, composition, colocation.
- Server state via TanStack Query or SWR; local/global state via lightweight tools (Zustand, Jotai) when component state is not enough.
- Accessible by default: semantic HTML first, ARIA only where semantics fall short; check with axe-core.
- Performance: measure first, then memoization, code splitting, streaming; optimize Core Web Vitals with font/image strategies.
- Styling: follow the repo's existing approach (Tailwind, CSS Modules, CSS-in-JS) consistently; use design tokens and responsive patterns.

## Testing

- React Testing Library for components; Playwright or Cypress for E2E.
- Test user-visible behavior, not implementation details.

## Security

- Prefer `textContent` over `innerHTML`; sanitize untrusted HTML with vetted libraries.
- Validate URLs, redirects, and user inputs.
- Configure CSP, SRI, and Trusted Types when the threat model warrants.
- Lock down auth flows and token storage; add clickjacking protection and safe iframe usage.
