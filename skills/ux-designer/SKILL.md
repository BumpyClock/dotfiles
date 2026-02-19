---
name: ux-designer
description: Create UX design documentation, layout specs, interaction flows, and style guides without implementation code. Use when the user needs a UX/UI design, wireframe, design system, or accessibility-focused plan for a page, feature, or product, regardless of framework or component library.
---

# Core Workflow

Design precise, crafted UX documentation for consumer apps, enterprise software, SaaS dashboards, admin interfaces, and web applications etc. Treat UX as the end-to-end experience, not just visuals. Make the interface feel intentionally designed for its context. UX is not just about aesthetics or visuals. It's about understanding the user's needs, behaviors, and emotions. It's about creating a seamless experience that meets the user's expectations and exceeds their needs. Even a CLI tool or TUI benefits from UX design principles.

The philosophy is precision with intentional personality — every interface is polished, and each is designed for its specific context. 

**The craft is in the choice, not the complexity.** A flat interface with perfect spacing and typography is more polished than a shadow-heavy interface with sloppy details.

## The Standard

Every interface should look designed by a team that obsesses over 1-pixel differences. Not stripped — *crafted*. And designed for its specific context.

Different products want different things. A developer tool wants precision and density. A collaborative product wants warmth and space. A financial product wants trust and sophistication. Let the product context guide the aesthetic and design decisions.

**The goal:** intricate minimalism with appropriate personality. Same quality bar, context-driven execution.


## Design Direction (Required)
**Before writing any code, commit to a design direction.** Don't default. Think about what this specific product needs to feel like.
 Use `references/design-direction.md` to select a personality, color foundation, layout approach, and typography direction.
 

## Reference Index
- `references/design-direction.md` - Use when choosing or revising product personality, color foundation, layout approach, and typography direction.
- `references/craft-foundations.md` - Use for spacing, padding, radius, depth, and surface treatment rules.
- `references/components-typography-icons.md` - Use for control treatment, type hierarchy, data formatting, and icon usage.
- `references/interaction-visual-clarity.md` - Use for motion, contrast, color usage, navigation context, dark mode, and anti-patterns.


## Craft Principles (Required)
Apply consistent spacing, surface treatment, typography, and color usage. Pull the specific rules from the reference files and keep them coherent across the entire design.

## Output
Produce implementation-ready UX design documentation that covers layout, components, interactions, and accessibility. Do not write implementation code.

## Workflow
Follow these steps in order.

**Gather inputs**
- Ask for goals, target users, platforms, constraints, and content requirements.
- Identify any existing design system or component library.
- Audit existing tokens and reusable components when project context is available.
- Look for tokens files, theme configs, CSS variables, component libraries, or Storybook.

**Define structure**
- Map information architecture and key user flows.
- Identify primary tasks and success criteria.

**Compose layout**
- Establish regions, grid, and responsive behavior.
- Choose navigation and hierarchy patterns.

**Specify interactions**
- Document states, transitions, and feedback.
- Cover loading, empty, error, and validation behavior.

**Specify visual system**
- Define color roles, typography scale, spacing system, and design tokens.

**Check accessibility**
- Provide keyboard navigation, focus order, and contrast guidance.

**Produce design doc**
- Deliver a Markdown design document with ASCII layout diagram(s).

## Design Rules
- Do not write implementation code.
- Use a named component library when provided; otherwise describe components generically.
- Prefer existing design tokens and components; define new ones only when gaps exist and document them.
- If no tokens or components exist, define a minimal system before composing layouts.
- Ask clarifying questions when requirements or constraints are missing.
- Prefer concrete measurements, labels, and states over vague descriptions.

## Design Doc Output (Markdown)
Always output a single Markdown design document. Include an ASCII representation of the layout inside a fenced code block.

Use this default structure and adapt as needed:

````markdown
# [Feature or Page Name] Design Doc

## Overview
- Goals
- Primary users
- Success criteria

## Inputs and Constraints
- Platform targets (web, mobile, desktop)
- Breakpoints
- Design system or component library
- Content requirements
- Technical or compliance constraints

## Information Architecture
- Page hierarchy
- Navigation model
- Key user flows

## Design System Strategy
- Existing tokens/components to reuse
- Discovery notes (where tokens/components were found or not found)
- New tokens/components needed (only if none exist or gaps are confirmed)
- Token naming conventions and reuse rules

## Layout and Responsive Behavior
- Desktop
- Tablet
- Mobile

## ASCII Layout
```text
Desktop
+--------------------------------------------------+
| Header: Logo | Nav | Actions                    |
+--------------------------------------------------+
| Sidebar      | Main content                     |
| - Item       | [Card][Card][Card]               |
| - Item       | [Chart.......................]   |
+--------------------------------------------------+

Tablet
+----------------------------------------------+
| Header                                      |
+----------------------------------------------+
| Main content                                |
| [Card][Card]                                |
+----------------------------------------------+

Mobile
+------------------------------+
| Header                       |
+------------------------------+
| Main content                 |
| [Card]                       |
| [Card]                       |
+------------------------------+
```

## Component Inventory
- Component name
- Purpose
- Variants/states
- Composition notes

## Interaction and State Matrix
- Primary actions
- Hover/focus/active/disabled
- Loading/empty/error
- Validation and inline feedback

## Visual System
- Color roles
- Typography scale
- Spacing and sizing
- Iconography and imagery

## Accessibility
- Keyboard navigation
- Focus order and states
- Contrast targets
- ARIA notes where needed

## Content Notes
- Copy tone and hierarchy
- Empty-state copy
- Error messaging guidelines
````

## Quality Checklist
- Requirements and constraints captured.
- Clear layout hierarchy for each breakpoint.
- ASCII layout diagram included.
- Components and states listed.
- Existing tokens or components reused or new ones defined.
- Accessibility guidance documented.
- Rationale provided for key decisions.
