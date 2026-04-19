# Animations

Based on Emil Kowalski's "Animations on the Web" course.

## Review Format

When reviewing animations, use a markdown table with `Before` and `After` columns so fixes are easy to scan.

## Quick Decision

1. **Is this element entering or exiting?** -> Use `ease-out`
2. **Is an on-screen element moving?** -> Use `ease-in-out`
3. **Is this a hover or color transition?** -> Use `ease`
4. **Will users see this 100+ times daily?** -> Don't animate it

## The Easing Blueprint

### ease-out (Most Common)

Use for **user-initiated interactions**: dropdowns, modals, tooltips, any element entering or exiting the screen.

```css
/* Sorted weak to strong */
--ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
--ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-out-circ: cubic-bezier(0.075, 0.82, 0.165, 1);
```

Why it works: acceleration at the start creates an instant, responsive feeling. The element jumps toward its destination and then settles in.

### ease-in-out (For Movement)

Use when **elements already on screen need to move or morph**. It mimics natural acceleration and braking.

```css
/* Sorted weak to strong */
--ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);
--ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);
--ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
--ease-in-out-quint: cubic-bezier(0.86, 0, 0.07, 1);
--ease-in-out-expo: cubic-bezier(1, 0, 0, 1);
--ease-in-out-circ: cubic-bezier(0.785, 0.135, 0.15, 0.86);
```

### ease (For Hover Effects)

Use for **hover states and color transitions**. The asymmetrical curve feels elegant for gentle changes.

```css
transition: background-color 150ms ease;
```

### linear (Avoid in UI)

Only use for:

- Constant-speed animations like marquees or tickers
- Time visualization like hold-to-delete progress indicators

Linear motion feels robotic for interactive UI.

### ease-in (Almost Never)

Avoid for UI animations. Slow starts delay visual feedback and make the interface feel sluggish.

## Paired Elements Rule

Elements that animate together must use the same easing and duration. Modal plus overlay, tooltip plus arrow, drawer plus backdrop: if they move as a unit, they should feel like a unit.

```css
.modal {
  transition: transform 200ms ease-out;
}

.overlay {
  transition: opacity 200ms ease-out;
}
```

## Timing and Duration

## Duration Guidelines

| Element Type | Duration |
| --- | --- |
| Micro-interactions | 100-150ms |
| Standard UI (tooltips, dropdowns) | 150-250ms |
| Modals, drawers | 200-300ms |
| Page transitions | 300-400ms |

**Rules:**
- UI animations should stay under 300ms
- Larger elements animate slower than smaller ones
- Exit animations can be about 20% faster than entrance
- Match duration to distance: longer travel, longer duration

## The Frequency

Determine how often users will see the animation:

- **100+ times/day** -> No animation, or drastically reduce it
- **Occasional use** -> Standard animation
- **Rare or first-time** -> Can be more special

Example: Raycast never animates because users open it hundreds of times a day.

## When to Animate

**Do animate:**

- Enter and exit transitions for spatial consistency
- State changes that benefit from visual continuity
- Responses to user actions
- Rarely-used interactions where delight adds value

**Don't animate:**

- Keyboard-initiated actions
- Hover effects on frequently-used elements
- Anything users interact with 100+ times daily
- Flows where speed matters more than smoothness

**Marketing vs. Product:**

- Marketing: more elaborate, longer durations allowed
- Product: fast, purposeful, never frivolous

## Spring Animations

Springs feel more natural because they do not have fixed durations. They simulate real physics.

### When to Use Springs

- Drag interactions with momentum
- Elements that should feel alive
- Gestures that can be interrupted mid-animation
- Organic or playful interfaces

### Configuration

**Apple-style config:**

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

**Traditional physics config:**

```js
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

### Bounce Guidelines

- Avoid bounce in most UI contexts
- Use bounce for drag-to-dismiss or playful interactions
- Keep bounce subtle, usually `0.1` to `0.3`

### Interruptibility

Springs maintain velocity when interrupted. CSS animations restart from zero. Springs are better for gestures users may reverse mid-motion.

## Performance

### The Golden Rule

Only animate `transform` and `opacity`. These skip layout and paint and usually stay on the GPU.

**Avoid animating:**

- `padding`, `margin`, `height`, `width`
- `blur` filters above `20px`, especially on Safari
- CSS variables in deep component trees

### Optimization Techniques

```css
.animated-element {
  will-change: transform;
}
```

**React-specific:**

- Animate outside React's render cycle when possible
- Use refs to update styles directly instead of state for frame-by-frame work
- Re-renders on every frame mean dropped frames

**Framer Motion:**

```jsx
<motion.div animate={{ transform: "translateX(100px)" }} />
<motion.div animate={{ x: 100 }} />
```

Prefer measuring both forms in the real UI instead of assuming.

### CSS vs. JavaScript

- CSS animations run off the main thread more often and stay smoother under load
- JS animation libs use `requestAnimationFrame`
- CSS is better for simple predetermined animations
- JS is better for dynamic and interruptible animations

## Accessibility

Animations can cause motion sickness or distraction for some users.

### prefers-reduced-motion

Whenever you add animation, add a reduced-motion path too:

```css
.modal {
  animation: fadeIn 200ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .modal {
    animation: none;
  }
}
```

### Reduced Motion Guidelines

- Every animated element needs its own `prefers-reduced-motion` rule
- Set `animation: none` or `transition: none`
- No exceptions for opacity or color: disable all animations
- Prefer explicit play controls over autoplay video

### Framer Motion Implementation

```jsx
import { useReducedMotion } from "framer-motion";

function Component() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    />
  );
}
```

### Touch Device Considerations

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover {
    transform: scale(1.05);
  }
}
```

Touch devices trigger hover on tap, causing false positives.

## Practical Tips

For concrete implementation patterns, see [PRACTICAL-TIPS.md](PRACTICAL-TIPS.md).

| Scenario | Solution |
| --- | --- |
| Make buttons feel responsive | Add `transform: scale(0.97)` on `:active` |
| Element appears from nowhere | Start from `scale(0.95)`, not `scale(0)` |
| Shaky or jittery animations | Add `will-change: transform` |
| Hover causes flicker | Animate a child element, not the hover target |
| Popover scales from wrong point | Set `transform-origin` to the trigger location |
| Sequential tooltips feel slow | Skip delay and animation after the first tooltip |
| Small buttons hard to tap | Use a 44px minimum hit area |
| Something still feels off | Add subtle blur under `20px` |
| Hover triggers on mobile | Use `@media (hover: hover) and (pointer: fine)` |

## Theme Transitions

Switching themes should not trigger random transitions across the page. Disable transitions during theme changes to avoid a flash of animated content.

## AnimatePresence

Use `popLayout` mode on `AnimatePresence` when an element has an exit animation and lives in a group layout.

## Drag Gestures

For drag-to-dismiss patterns, support velocity-based completion. A velocity threshold around `0.10` is a useful starting point, then tune against the real interaction.

## Looping Animations

Pause looping animations when off-screen to save resources.

## Reference Files

- [PRACTICAL-TIPS.md](PRACTICAL-TIPS.md) - Detailed implementations for common animation scenarios
