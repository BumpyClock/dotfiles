# Review Guidance Patterns

WinUI 3 XAML review patterns. Use as pitfall/fix checklist.

## 1. Brush References Must Target Brush Resources

`ResourceKey` must reference `SolidColorBrush` resource (suffix `Brush`), not `Color`.

```xml
<!-- Wrong -->
<StaticResource x:Key="TextControlBackground" ResourceKey="ControlFillColorDefault" />

<!-- Correct -->
<StaticResource x:Key="TextControlBackground" ResourceKey="ControlFillColorDefaultBrush" />
```

Applies to High Contrast as well:

```xml
<!-- Wrong -->
<StaticResource x:Key="MyBrush" ResourceKey="SystemColorWindowColor" />

<!-- Correct -->
<StaticResource x:Key="MyBrush" ResourceKey="SystemColorWindowColorBrush" />
```

## 2. Prefer StaticResource Redirects Over Inline SolidColorBrush

Inline brushes allocate new objects. Redirect to existing WinUI brushes:

```xml
<!-- Wrong -->
<SolidColorBrush x:Key="ButtonBackground" Color="{StaticResource ControlFillColorDefault}" />

<!-- Correct -->
<StaticResource x:Key="ButtonBackground" ResourceKey="ControlFillColorDefaultBrush" />
```

## 3. High Contrast Rules (Strict)

- Only 8 system color brushes in HighContrast dictionaries.
- No hardcoded colors, no opacity, no accent colors, no regular WinUI brushes in HC.
- No gradient animations in HC. Use a single SystemColor brush.
- Use `{ThemeResource}` only for `SystemColor*` in HC; use `{StaticResource}` elsewhere.
- Use empty HC dictionary when WinUI defaults suffice:
  `<ResourceDictionary x:Key="HighContrast" />`
- Set `HighContrastAdjustment = ApplicationHighContrastAdjustment.None` once at app level.

## 4. Remove Defaults and Redundant Properties

Avoid setting WinUI defaults; blocks future updates.

```xml
<!-- Wrong: defaults -->
<Button Padding="12" Height="32" CornerRadius="4" Content="Action" />

<!-- Correct: only set what differs -->
<Button MinHeight="40" Content="Action" />
```

Do not set defaults explicitly:
- `BodyTextBlockStyle` on TextBlock
- `TextFillColorPrimaryBrush` on TextBlock
- `TextWrapping="NoWrap"`
- `Padding="0"` or `Margin="0"`
- `VerticalAlignment="Top"` / `HorizontalAlignment="Left"`

## 5. Corner Radius Must Use System Resources

```xml
<!-- Correct -->
<Border CornerRadius="{StaticResource ControlCornerRadius}" />
<Border CornerRadius="{StaticResource OverlayCornerRadius}" />
```

Never hardcode `CornerRadius="3"` or `CornerRadius="7"`.

## 6. Typography Must Use Styles

Use system text styles, not raw font props:

```xml
<!-- Wrong -->
<TextBlock FontSize="14" FontFamily="Segoe UI" FontWeight="Normal" />

<!-- Correct -->
<TextBlock Style="{StaticResource BodyTextBlockStyle}" />
```

Additional rules:
- Use `SemiBold`, never `Bold`.
- Minimum 12px font size.
- `BasedOn` styles must not re-declare inherited properties.
- Use `{ThemeResource SymbolThemeFontFamily}` for icon fonts.

## 7. Text Scaling and Localization

Validate large text scale + long strings:
- Use `MinHeight` instead of `Height`.
- Avoid fixed widths on buttons and text containers.
- Prefer `VerticalAlignment="Center"` over fixed positioning.
- Test at max text scaling and with long/localized strings.

## 8. Container Simplification

Remove wrappers with no layout/styling value:
- If a Button contains only a SymbolIcon, put it directly in `Content`.
- Use `Border` for single-child background containers, not `Grid`.
- Remove StackPanel/Grid wrappers around single elements.

## 9. TextTrimming Requires Grid Constraints

`StackPanel` and `ColumnDefinition Width="Auto"` block trimming:

```xml
<!-- Wrong -->
<StackPanel Orientation="Horizontal">
    <TextBlock TextTrimming="CharacterEllipsis" />
</StackPanel>

<!-- Correct -->
<Grid.ColumnDefinitions>
    <ColumnDefinition Width="*" />
</Grid.ColumnDefinitions>
<TextBlock Grid.Column="0" TextTrimming="CharacterEllipsis" />
```

## 10. 4px Grid for Layout

Margins, padding, sizes = multiples of 4 (4, 8, 12, 16...). Avoid 3, 5, 7, 11, 15.

## 11. Flyout and Acrylic Surfaces

Flyout surfaces:

```xml
Background="{ThemeResource FlyoutPresenterBackground}"
BorderBrush="{ThemeResource FlyoutBorderThemeBrush}"
BorderThickness="{ThemeResource FlyoutBorderThemeThickness}"
CornerRadius="{StaticResource OverlayCornerRadius}"
```

Acrylic pairings:
- Flyouts/tooltips: `AcrylicBackgroundFillColorDefaultBrush` + `SurfaceStrokeColorFlyoutBrush`
- UI surfaces: `AcrylicBackgroundFillColorBaseBrush` + `SurfaceStrokeColorDefaultBrush`

Bordered acrylic: `BackgroundSizing="InnerBorderEdge"`.

## 12. ThemeShadow and Elevation

ThemeShadow requires elevation:

```xml
Translation="0,0,32"
```

Add 12px parent padding to prevent shadow clipping. Prefer ThemeShadow over composition drop shadows.

## 13. Reused Values Should Be Named Resources

Repeated margin/padding/thickness value → named resource.

## 14. Icon Sizing and Spacing

- Prefer FontIcon with `FontSize` for system icons.
- Use standard even sizes (16, 20, 24, 32).
- Use `UniformToFill` for non-square images to avoid distortion.
- Keep icon padding consistent on all sides.

## 15. BasedOn Style Inheritance

With `BasedOn`, remove setters duplicating base style. Keep differences only.

## 17. ScrollViewer Configuration

- `VerticalScrollBarVisibility="Auto"` (default is Visible).
- `HorizontalContentAlignment="Stretch"` to prevent content collapse.
- Only the content area should scroll; headers/actions remain fixed.

## 18. ProgressBar / ProgressRing Defaults

Keep default templates. Custom overrides (CornerRadius, Foreground) caused contrast/accessibility bugs.

## 19. Button.Resources for Single-Use Visual States

Single button hover/pressed visuals: use `Button.Resources` + theme dictionaries, not new style/template.
