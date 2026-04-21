# Components, Type, and Icons

Read when: you need guidance for controls, typography scales, data presentation, or icon usage.

## Isolated Controls
- Treat pickers, filters, and dropdowns as crafted objects, not plain text.
- Avoid native form controls for styled UI (select, date input). Use custom triggers and popovers instead.
- For custom select triggers, use inline-flex and no-wrap text to keep label and chevron on one line.

## Typography Hierarchy
- Headlines: 600 weight, tight tracking (-0.02em).
- Body: 400 to 500 weight, normal tracking.
- Labels: 500 weight, slight positive tracking for uppercase.
- Scale: 11, 12, 13, 14 (base), 16, 18, 24, 32 px.

## Text Wrapping
- Use balanced wrapping for headings, titles, and short blocks where even line length matters.
- Use pretty wrapping for short-to-medium paragraphs, descriptions, captions, list items, and card text.
- Skip special wrapping for long copy, code blocks, and preformatted text.
- Call out wrapping intent in specs so implementation avoids orphaned heading/body lines.

## Font Rendering
- Specify app-wide antialiasing/font smoothing when crisp text is part of the visual direction.
- Apply it at the root/system level for consistency, not per component.

## Monospace for Data
- Use monospace for numbers, IDs, codes, and timestamps.
- Use tabular-nums for column alignment.
- Use tabular numbers for dynamic counters, timers, changing prices, scores, dashboards, and numeric table columns.
- Avoid tabular numbers for phone numbers, zip codes, version strings, and decorative numerals unless alignment is the task.

## Iconography
- Use Phosphor Icons when an icon adds meaning.
- Remove decorative icons that add no semantic value.
- Give standalone icons subtle containers so they feel intentional.
- Align icons optically when geometric centering looks wrong.
- For text + icon buttons, make icon-side padding about 2px smaller than text-side padding when it improves balance.
- For play triangles and asymmetric icons, shift the glyph optically or fix the SVG/viewBox when possible.

## Hit Areas
- Target 44x44px for interactive controls; 40x40px is the practical floor for dense UI.
- If the visible control is smaller, specify an expanded hit area.
- Expanded hit areas must not overlap nearby interactive elements.
