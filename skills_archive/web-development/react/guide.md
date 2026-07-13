---
name: react
description: React and Next.js implementation, review, debugging, and performance guidance for modern web apps. Use when the request is clearly React-specific, including component architecture, hooks, rendering behavior, state flow, Server Components, or React-specific verification.
---

# React

## Workflow
- Confirm the request is React-specific before loading this guide. For framework-agnostic UI work, start with `../design-engineering/guide.md`.
- Audit the existing app structure first: framework version, router, state approach, styling system, and component boundaries.
- Prefer existing framework features and repo conventions over custom abstractions.
- Run `react-doctor` after meaningful React changes or during React-specific bug triage.

## Core Rules
- Keep components small, composable, and explicit about state ownership.
- Prefer derived state over duplicated state.
- Avoid render-loop bugs from effect-driven state syncing.
- Use semantic HTML and accessible state patterns before adding custom behavior.
- Treat performance as a correctness concern when UI jank is user-visible.

## Focus Areas
- Component boundaries, composition, and prop APIs
- Hook usage, effects, and state flow
- Rendering behavior, concurrency, and update frequency
- Forms, loading states, optimistic UI, and error handling
- Next.js server/client boundaries when applicable
- React-specific verification with `react-doctor`

## Companion References
- `react-doctor.md` for verification workflow
- `../design-engineering/guide.md` for language-agnostic UI guidance
- `../../programming/references/languages/typescript-frontend.md` for broader TypeScript/frontend implementation rules
