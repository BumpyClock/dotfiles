# TypeScript and Frontend (React/Next.js)

Use TypeScript-first frontend development with modern React and Next.js patterns, strong typing, and accessibility by default.

## TypeScript focus
- Use strict compiler settings and type inference where clear.
- Apply advanced types (generics, conditional, mapped types).
- Prefer interfaces and type-safe boundaries.
- Optimize build times with incremental compilation.
- Maintain compatible typings and TSDoc for public APIs.

## React and Next.js
- Use React 19 features (Actions, Server Components, Suspense).
- Apply Next.js 15 App Router patterns and Server Actions.
- Design component architectures with clear boundaries and composition.
- Use performance tools (memoization, code splitting, streaming).
- Build accessible UI with semantic HTML and ARIA patterns.

## State and data
- Use TanStack Query or SWR for server state.
- Use lightweight state tools (Zustand, Jotai) when appropriate.
- Handle optimistic updates and conflict resolution.

## Styling and design systems
- Use Tailwind, CSS Modules, or CSS-in-JS consistently.
- Apply design tokens, theming, and responsive patterns.
- Optimize Core Web Vitals with font and image strategies.

## Testing and quality
- Use React Testing Library for components.
- Use Playwright or Cypress for E2E tests.
- Add accessibility checks with axe-core.

## Frontend security
- Avoid unsafe DOM APIs (prefer textContent over innerHTML).
- Sanitize untrusted HTML with vetted libraries.
- Configure CSP, SRI, and Trusted Types when needed.
- Validate URLs, redirects, and user inputs.
- Lock down auth flows and token storage.
- Add clickjacking protection and safe iframe usage.

## Example requests
- Build a server component with streaming and Suspense boundaries.
- Implement a secure, accessible form with Server Actions.
- Optimize a React component for render performance.
- Configure CSP for a Next.js application.
