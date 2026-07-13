# Web Development

**Load when:** changing browser-rendered UI or web app behavior. Repo conventions, installed versions, and browser support policy win.

## Interaction Correctness

- Prefer semantic elements and browser-native behavior. Add ARIA or custom interaction only where native semantics fall short.
- Associate labels with controls, choose input types that match data, and preserve native form submission.
- Support keyboard and touch alongside pointer input. Keep focus visible, return it after transient UI closes, and avoid hover-only behavior.
- Give compact controls usable hit areas without requiring their visual bounds to grow.
- Reuse existing design tokens, components, and styling conventions before adding one-off primitives.

## Layout And Motion

- Reserve known space for media and async content to avoid layout shifts.
- Use motion to explain state or spatial change, not by default. Frequent product actions often need less motion than occasional or marketing interactions.
- Honor `prefers-reduced-motion`. Name transitioned properties instead of using `transition: all`.
- Check hover behavior on touch-capable devices and interruption behavior for interactive animations.

## React

- Keep state ownership clear. Derive values where possible instead of syncing duplicate state through effects.
- Respect server/client boundaries already used by repo.
- Use project-provided diagnostics when useful. Treat findings and scores as signals, then re-run relevant checks after fixes.

## Verification

- Verify rendered behavior at relevant viewport sizes and input modes, not only types/tests.
- Check keyboard path, focus order, reduced motion, form errors, loading/empty states, and layout stability when change touches them.
- Measure before performance work. Prefer repo's existing browser tests and accessibility tooling.
