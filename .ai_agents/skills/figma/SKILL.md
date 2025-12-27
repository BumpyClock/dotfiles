---
name: figma
description: Generate or update UI components from Figma designs using Figma MCP. Use when a task requires extracting layout, colors, typography, or spacing from Figma, reusing design tokens and existing styles, and validating the result in the browser with Playwright.
---

Implement components that match Figma designs precisely. Use Figma MCP and Playwright MCP to drive the workflow. Follow the project's coding instructions and avoid inventing new styles when existing ones apply.

## Workflow

1. Confirm inputs
   - Identify the Figma node(s) to implement.
   - If updating an existing component, identify the component file and local dev URL (ask the user if unknown).

2. Collect design data with Figma MCP
   - Inspect the selected node to extract layout, colors, typography, spacing, and structure.
   - Use `get_variable_defs` to gather tokens and variables used by the component.
   - Use `get_image` to capture a visual reference.
   - If using `get_code`, use the `programming` skill for coding best practices and rules.

3. Reuse existing styles
   - Check the component's styles file for applicable styles.
   - Check shared styles or the design system for applicable styles.
   - Prefer tokens and variables; avoid hardcoding values that should come from tokens.
   - Avoid creating new styles when an existing one fits the design.

4. Implement the component
   - Match Figma structure and styles exactly; do not deviate from the design.
   - Ensure code is clean, well-structured, and follows the guidelines in `programming` skill (locate them in the repo or ask the user if missing).

5. If updating an existing component
   - Use Playwright MCP to capture the current component image for visual comparison.
   - Compare against the Figma reference to identify discrepancies.

6. Validate in the browser
   - Use Playwright MCP to test behavior and visual parity with Figma.
   - Debug and fix issues until the component matches the design.

7. Review loop
   - Ask the user to review the component and provide feedback.
   - Apply requested changes using the changes tool.
