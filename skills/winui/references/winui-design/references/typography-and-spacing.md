# Typography and Spacing Reference

## Typography — Type Ramp

Use **built-in TextBlock styles**; never set `FontSize` or `FontWeight` manually. Type ramp uses **Segoe UI Variable** and scales across displays.

| Style | Use for |
|-------|---------|
| `CaptionTextBlockStyle` | Labels, timestamps, metadata |
| `BodyTextBlockStyle` | Body text, descriptions (default) |
| `BodyStrongTextBlockStyle` | Emphasized body text |
| `BodyLargeTextBlockStyle` | Introductory text |
| `SubtitleTextBlockStyle` | Section headings |
| `TitleTextBlockStyle` | Page titles |
| `TitleLargeTextBlockStyle` | Hero headings |
| `DisplayTextBlockStyle` | Splash / display only |

Reference these `StaticResource` styles. Never hardcode font sizes, weights, or line heights.

```xml
<!-- GOOD — use built-in styles -->
<TextBlock Text="Settings" Style="{StaticResource SubtitleTextBlockStyle}" />
<TextBlock Text="Choose your preferences below." Style="{StaticResource BodyTextBlockStyle}" />
<TextBlock Text="Last updated: 3/10/2026" Style="{StaticResource CaptionTextBlockStyle}" />

<!-- BAD — never hardcode font properties -->
<TextBlock Text="Settings" FontSize="20" FontWeight="SemiBold" />
```

**Minimum sizes:** 12px Regular labels, 14px SemiBold smallest bold text. Never below 12px.

---

## Spacing — 4px Grid

Spacing and sizing values must be **multiples of 4px** for alignment + DPI scaling.

**Standard spacing scale (effective pixels):**

| Value | Use for |
|-------|---------|
| **4px** | Compact spacing between tightly related elements |
| **8px** | Spacing between a control and its label, between grouped controls |
| **12px** | Spacing between a control and its header, surface edge to text |
| **16px** | Padding inside cards and list items |
| **24px** | Spacing between content sections |
| **36px** | Page-level padding (content area margins) |
| **48px** | Spacing between major page sections with titles |

```xml
<!-- GOOD — multiples of 4 -->
<StackPanel Spacing="8">
    <TextBlock Text="Name" Style="{StaticResource BodyStrongTextBlockStyle}" />
    <TextBox PlaceholderText="Enter your name" />
</StackPanel>

<Grid Padding="36" RowSpacing="24" ColumnSpacing="16">
    <!-- Page content with standard padding and section spacing -->
</Grid>

<!-- BAD — arbitrary values -->
<StackPanel Spacing="10" Margin="15,7,15,7" />
```
