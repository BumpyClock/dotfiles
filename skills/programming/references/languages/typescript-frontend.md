# TypeScript and Frontend (React/Next.js)

**Load when:** repo contains TypeScript or React/Next.js code. Match the framework and library versions in `package.json`; check installed versions before reaching for newer APIs (Server Components, Actions, etc.).

## React / Next.js

- Server state via TanStack Query or SWR; local/global state via lightweight tools (Zustand, Jotai) when component state is not enough.
- Test user-visible behavior, not implementation details: React Testing Library for components; Playwright or Cypress for E2E.

## Security

- Prefer `textContent` over `innerHTML`; sanitize untrusted HTML with vetted libraries.
- Validate URLs, redirects, and user inputs.
- Configure CSP, SRI, and Trusted Types when the threat model warrants.
- Lock down auth flows and token storage; add clickjacking protection and safe iframe usage.
