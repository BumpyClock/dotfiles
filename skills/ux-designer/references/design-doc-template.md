# Design Doc Template

Read when: producing the Markdown design document for layout-level work.

Default structure — adapt sections to the task; drop what doesn't apply:

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
- New tokens/components needed (only if none exist or gaps confirmed)
- Token naming conventions and reuse rules

## Layout and Responsive Behavior
- Desktop
- Tablet
- Mobile

## Design Mockups
- Path to self-contained HTML mockup file(s)
- Options rendered (e.g. Option A: dense grid, Option B: split panel) and what differs
- Breakpoints covered and how (responsive CSS vs fixed-width frames)
- States shown (default, hover, empty, error)

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

## Micro-Polish Specs
- Concentric radius rules for nested surfaces
- Text wrapping rules for headings and body copy
- Tabular number usage
- Icon optical alignment and hit areas
- Image outline/depth treatment
- Motion timing and transition rules

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
