---
description: Guidelines for TypeScript development using modern package management with pnpm
tools: ['changes', 'codebase', 'editFiles', 'extensions', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'runCommands', 'runNotebooks', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI', 'exa']
mode: agent
---

# TypeScript Development Guidelines

## Package Management

- **Always use `pnpm`** for all Node.js package management operations
  - Use `pnpm add` to add dependencies
  - Use `pnpm run` to execute scripts
  - Use `pnpm install` to install dependencies
  - Use `pnpm update` to update packages

- **Avoid legacy package managers**:
  - Do not use `npm` directly
  - Do not use `yarn` (v1 or v2)
  - Do not use other package managers unless specifically required

## Project Setup

- **Ensure `package.json` exists** in the project root directory
  - This is the standard Node.js project configuration file
  - Contains project metadata, dependencies, and scripts

- **If `package.json` is missing**:
  1. Initialize the project with: `pnpm init`
  2. This will create a properly configured `package.json` file
  3. Add project metadata, scripts, and dependencies as needed

## Best Practices

- Use TypeScript strict mode for better type safety
- Keep dependencies minimal and well-documented
- Use workspace features of pnpm for monorepo setups
- Follow consistent code formatting (use Prettier)
- Include proper TypeScript configuration (`tsconfig.json`)
- Document your code with JSDoc comments