# System Backdrop (Mica/Acrylic)

Use when applying window materials.

Key rules
- Prefer `Window.SystemBackdrop` (Windows App SDK 1.3+).
- Use `MicaBackdrop` for app window backgrounds.
- Use `DesktopAcrylicBackdrop` for transient UI (flyouts, menus).
- Provide fallback when unsupported or disabled by policy.
- Only one system backdrop per window.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/system-backdrop-controller
- https://learn.microsoft.com/en-us/windows/apps/design/style/mica
- https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic
