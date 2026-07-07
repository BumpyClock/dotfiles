# Mobile App Screens

Read when: designing mobile app screens, multi-screen flows, or per-screen mockups (iOS, Android, cross-platform).

Screens must read as real app screens, not websites shrunk into a phone frame and not posters. Core references still apply; this file adds mobile-specific rules.

## Platform Mode (decide first)
Pick one and stay coherent — don't mix iOS and Android patterns carelessly:
- **iOS-native**: clean top areas, tab-bar clarity, native-feeling sheets/cards, restrained chrome, calm hierarchy.
- **Android-native**: firmer component rhythm, explicit app-bar behavior, bottom navigation clarity, clearer state.
- **Cross-platform neutral**: universal nav patterns, less platform ornament, broadly buildable.

## Safe Areas and System Regions
Design around status bar, title region, bottom navigation, home indicator, sheet docking zone, gesture space. Never place critical UI in unsafe zones. Spec safe-area insets explicitly in layout sections.

## Navigation
Believable, familiar patterns: tab bar for major sections, stack push for drill-down, sheets for secondary tasks, segmented controls for local switching. Don't overload the tab bar, hide the primary path, or flatten hierarchy so every action looks equal.

## First Screen Cleanliness
The first visible screen (onboarding, home, auth) matters most: one focal point, short headline (1-3 lines), concise support, one clear next action. No stat/chip/pill overload, no buried CTA, no website-hero-in-a-phone. If imagery sits behind text, protect readability with fades, masks, or scrims.

## Flow Logic
Multi-screen sets must form a believable journey (onboarding → auth → home; browse → detail → cart → checkout). For each screen ask: what action leads here, and does state carry forward? Random unrelated screens fail.

Lock a design bible before screen 2 and hold it across the set: platform mode, palette logic, type rhythm, spacing system, radius logic, icon style, image treatment, navigation model, button styling. Screen 4 must not drift into a different app.

## Screen-to-Screen Variation
Vary composition, image/text balance, density, CTA placement, and tempo across the flow — but never product identity or the design system. Onboarding especially: distinct compositions per screen, not three template slides with a swapped icon.

## Readability Floor
If text feels small, the design is not finished. Readable beats clever, dense, and decorative. Fixes in priority order: simplify layout, cut content, enlarge type, split into another screen. Comfortable minimums for specs: body ~15-17px equivalent, labels never below ~11px, AA contrast throughout.

## Layout Discipline
No box-in-box-in-box: avoid nested card stacks, five levels of framing, widget walls, decorative pills and micro-status clutter. Prefer fewer, clearer containers; whitespace and grouping over surfaces; one strong structural move per screen.

Not always simple — always clean: screens may be rich, layered, and image-led if hierarchy stays readable. Forced hyper-minimalism is not the goal; muddy clutter is the failure.

## Imagery and Texture
- Image-behind-text is a premium mobile move when controlled: bottom-to-top fade into the surface color, side masks, soft scrims under headline + CTA. Never raw imagery under text.
- Fixed media frames: stable aspect ratios, consistent crop behavior, repeatable modules, one radius logic.
- Subtle texture (grain, paper, tonal fog) beats sterile flat backgrounds for consumer apps — controlled, never competing with the UI.
- Iconography: one coherent family with consistent stroke/fill logic and a bit of brand character; generic default icon-pack look reads as template.

## Category Biases
- **Fintech**: trust, calm spacing, clear numbers, transaction clarity — no decorative chart spam.
- **Health/fitness**: strong metric hierarchy, airy spacing, motivating not noisy.
- **Productivity**: list/card discipline, simple navigation, calm density.
- **Social**: feed/profile rhythm, expressive imagery, clear create-vs-browse hierarchy.
- **Commerce**: browse → detail → cart clarity, stable product-card proportions, product imagery first.
- **Wellness/lifestyle**: soft materials, calm type, tactile backgrounds, breathing room.

## Mobile Anti-Tells
Fake dashboard/chart spam; 12 widgets fighting on one home screen; cloned screens in a flow; giant empty cards; purple-blue fintech gradients; glass cards without purpose; pill/badge/micro-label overload; meaningless avatar rows; filler copy ("elevate your life", "seamless control"). See `anti-slop-tells.md` for the full catalog.

## Mockup Delivery
Render each screen at a realistic device width (e.g. 390px frame) with a clean consistent frame treatment across the set: same device style, same scale, even outer margins, soft controlled shadow. Content is the hero; the frame supports it. One HTML file can hold the flow as side-by-side framed screens in journey order, labeled per screen. For unclear details, add a dedicated enlarged detail panel rather than expecting readers to squint.
