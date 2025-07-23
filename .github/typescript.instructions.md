---
applyTo: "**/*.ts,**/*.tsx"
---

# Project coding standards for TypeScript and React

Apply the [general coding guidelines](./writing-code.instructions.md) to all code.

## TypeScript Guidelines
- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use interfaces for data structures and type definitions
- Prefer immutable data (const, readonly)
- Use optional chaining (?.) and nullish coalescing (??) operators

## React Guidelines
- Use functional components with hooks
- Follow the React hooks rules (no conditional hooks)
- Use React.FC type for components with children
- Keep components small and focused
- Use styles.ts for component styling
- use global design tokens for consistent theming

# Component creation guidelines


## Design System Guidelines
- Use the `src/design-system` directory for design tokens and utilities
- Use the `src/components/ui` directory for reusable UI components
- Use the `src/components` directory for application-specific components


# MCP Servers
## Figma Dev Mode MCP Rules
- IMPORTANT: Always use components from `/src/components/ui` when possible
- Prioritize Figma fidelity to match designs exactly
- Avoid hardcoded values, use design tokens from Figma where available
- Follow WCAG requirements for accessibility
- Add component documentation
- Place UI components in `/src/components`; avoid inline styles unless truly necessary

  - The Figma Dev Mode MCP Server provides an assets endpoint which can serve image and SVG assets
  - IMPORTANT: If the Figma Dev Mode MCP Server returns a localhost source for an image or an SVG, use that image or SVG source directly
  - IMPORTANT: DO NOT import/add new icon packages, all the assets should be in the Figma payload
  - IMPORTANT: do NOT use or create placeholders if a localhost source is provided

## Playwright MCP Rules
  - The Playwright MCP Server provides a `playwright-mcp` server which can be used to check your implementation.
  - IMPORTANT: Ask the user if the the server is running before using it
  - IMPORTANT: Use the `playwright-mcp` server for all Playwright related tasks
  - IMPORTANT: Do not use the `playwright` package directly, use the `playwright-mcp` server instead
  
  