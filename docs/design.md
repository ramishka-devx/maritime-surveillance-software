# SERENGUARD — Light Theme Design System

> Design reference: the redesigned maritime surveillance dashboard. This document specifies a reusable visual language for the application, not just the map screen.
>
> **Note:** Color values are visually approximated from the generated mockup, rather than extracted from an original Figma token library. Treat them as implementation-ready starting values.

## 1. Design direction

**Style:** Clean, professional enterprise SaaS; light interface with restrained maritime-blue accents.

**Core principles**

1. **Clarity over decoration:** Make maps, vessel data, and operational states easy to scan. Avoid ornamental gradients and heavy borders.
2. **Strong hierarchy:** Use dark headings, muted supporting labels, and one primary accent per area. Important readings (speed, course, status) stand out.
3. **Map-first workflow:** The map is the primary canvas; toolbars and vessel panels float above it without obscuring too much geography.
4. **Progressive disclosure:** Show essential vessel facts initially. Place secondary information in a dossier or expanded detail view.
5. **Consistent surfaces:** White panels, very light gray-blue input backgrounds, subtle borders, modest corner radii, and soft shadows.
6. **Semantic status colors:** Blue is interaction/information, green is healthy/live, red is critical/alert, and amber is caution. Do not use red for ordinary navigation.
7. **Accessible interactions:** Ensure readable contrast, keyboard focus states, comfortable targets, and colors paired with text or icons.
8. **Operational density without clutter:** Use compact, aligned data rows and predictable spacing rather than excessive whitespace inside technical data tables.

## 2. Color palette

### Brand and interaction

| Token | Hex | Use |
|---|---|---|
| `primary-600` | `#006BF0` | Primary buttons, links, emphasized values |
| `primary-700` | `#0056C7` | Primary hover/pressed states |
| `primary-500` | `#1685F8` | Icons and secondary emphasis |
| `primary-100` | `#E8F4FF` | Active sidebar item, selected map layer, subtle info surfaces |
| `primary-50` | `#F3F9FF` | Quiet blue-tinted backgrounds |
| `cyan-500` | `#16B8DD` | Optional maritime accent / telemetry emphasis |

### Neutral surfaces and text

| Token | Hex | Use |
|---|---|---|
| `background` | `#F7FAFD` | Application background outside the map |
| `surface` | `#FFFFFF` | Sidebar, top bar, popovers, vessel panel |
| `surface-subtle` | `#F3F7FB` | Metric cards, form controls, toolbar segments |
| `surface-hover` | `#EEF4FA` | Neutral hover states |
| `border` | `#E1EAF3` | Card borders, dividers, input outlines |
| `border-strong` | `#CAD8E8` | Emphasized outlines |
| `text-primary` | `#13254A` | Titles, key values, primary body text |
| `text-secondary` | `#4E658B` | Labels, ordinary navigation items, supporting text |
| `text-muted` | `#7E91AF` | Section headers, hints, metadata |
| `text-on-primary` | `#FFFFFF` | Text/icons on blue buttons |

### Semantic colors

| Token | Hex | Background | Use |
|---|---|---|---|
| `success` | `#009C61` | `#E1F7EB` | Online, normal, healthy, underway |
| `danger` | `#E53B46` | `#FFF0F2` | Alerts, intercept, critical states |
| `warning` | `#B86A00` | `#FFF4DD` | Caution, review required |
| `info` | `#006BF0` | `#E8F4FF` | Informational states |

**Map colors:** The map itself can retain realistic blue ocean (`#205B96` to `#326CA6`, varying with geographic imagery), green/dark land, and high-contrast outlined vessel markers. These are map-renderer colors, not UI surface tokens.

### Suggested CSS tokens

```css
:root {
  --color-primary: #006bf0;
  --color-primary-hover: #0056c7;
  --color-primary-soft: #e8f4ff;
  --color-cyan: #16b8dd;

  --color-background: #f7fafd;
  --color-surface: #ffffff;
  --color-surface-subtle: #f3f7fb;
  --color-surface-hover: #eef4fa;
  --color-border: #e1eaf3;
  --color-border-strong: #cad8e8;

  --color-text: #13254a;
  --color-text-secondary: #4e658b;
  --color-text-muted: #7e91af;

  --color-success: #009c61;
  --color-success-bg: #e1f7eb;
  --color-danger: #e53b46;
  --color-danger-bg: #fff0f2;
  --color-warning: #b86a00;
  --color-warning-bg: #fff4dd;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --shadow-panel: 0 12px 32px rgba(19, 37, 74, 0.12),
                  0 2px 6px rgba(19, 37, 74, 0.06);
  --shadow-floating: 0 18px 48px rgba(9, 31, 63, 0.16);
}
```

## 3. Typography

**Recommended font:** `Inter` (fallback: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`). Use a monospaced font such as `JetBrains Mono` or `ui-monospace` **only for** MMSI, IMO, coordinates, headings, and other fixed-width telemetry where alignment helps.

| Role | Size | Weight | Guidance |
|---|---|---|---|
| Page / panel title | 18–20px | 650–700 | Dark navy |
| Card heading / vessel name | 16–18px | 650–700 | Uppercase only for vessel names if data source requires it |
| Navigation / body | 14px | 450–550 | Readable sentence case |
| Buttons | 13–14px | 600 | Consistent verbs |
| Data value | 16–22px | 650–700 | Emphasize speed/course |
| Field label | 11–12px | 550–650 | Muted; optional uppercase |
| Metadata | 12px | 400–500 | Muted secondary text |

- Use line-height around **1.4–1.5** for body copy; tighter for prominent numeric metrics.
- Prefer **sentence case** for navigation and actions; reserve all caps for short operational labels such as `AIS STREAM`.
- Always distinguish units: `10.7 KTS`, `97° T`, and `180 m × 26 m`.

## 4. Layout and spacing

Use a **4px spacing base** with common increments `4, 8, 12, 16, 20, 24, 32`.

| Element | Recommended rule |
|---|---|
| Desktop sidebar | 250–280px fixed width |
| Desktop top bar | 68–80px height |
| Bottom map toolbar | 56–64px height |
| Floating vessel card | 420–480px width, max-height based on viewport |
| Card internal padding | 20–24px |
| Standard grid gap | 12px |
| Panel corner radius | 12–16px |
| Button/input radius | 8px |
| Thin borders | 1px |
| Primary interactive targets | At least 40–44px high |

**Responsive behavior:** On medium screens, collapse the sidebar to icons or a drawer and keep search compact. On mobile, show the vessel card as a bottom sheet rather than a large floating panel; preserve map visibility. Avoid horizontal scrolling for core controls.

## 5. Component styling

### Sidebar

- White background with a thin right border.
- Product emblem, bold dark brand name, and small blue descriptor at the top.
- Muted uppercase section headers (`OPERATIONS`, `ADMINISTRATION`).
- Navigation rows: 40–48px tall, 8–12px rounded corners, consistent left padding and icon alignment.
- **Active:** `primary-100` background, `primary-600` icon and text; do not rely on color alone—add weight or a left indicator.
- **Inactive:** `text-secondary`; subtle `surface-hover` on mouse hover.
- Count badges: neutral for zero, red only for actionable alerts.
- Online footer: pale neutral panel with green dot and explicit `ONLINE` label.

### Top navigation

- White strip with thin bottom border; align all elements along one baseline.
- Search field: pale gray-blue background, border, search icon, and shortcut hint. Make the search affordance visually dominant without overpowering the map.
- Telemetry and time: light chips with clear icon/status dot and compact metadata.
- Profile: circular initials/avatar plus name and role, with dropdown chevron.

### Vessel details card

**Hierarchy:**

1. Header: vessel icon, name, `NORMAL` pill, MMSI/IMO, overflow and close actions.
2. Navigation health banner: soft blue background, green shield/icon, concise status description.
3. Two-column metric tiles: **Speed over ground** / **Course over ground** with large blue values.
4. Secondary tiles: **Vessel type** / **Flag state** with regular dark values.
5. Compact key–value list: position, navigation status, dimensions, destination, last broadcast.
6. Action footer: `Track` (secondary blue), `Intercept` (danger outline/tint), `Dossier` (primary blue).

Use consistent tile heights, 12px gaps, subtle separators, and right-aligned numeric values. Keep real-time updates from causing layout shifts.

### Buttons

| Variant | Treatment | Intended use |
|---|---|---|
| Primary | Solid `primary-600`, white label | Main workflow, e.g. `Dossier` |
| Secondary | Soft blue background, blue label/border | `Track`, filter controls |
| Neutral | White or pale gray with subtle border | Map layers, secondary tools |
| Danger | Light red fill and red outline/text | `Intercept`, alert workflows |
| Icon-only | Neutral square button | Zoom, close, more actions |

- Keep icon size around **16–18px**, button heights around **40–44px**.
- Implement hover, active, focus-visible, loading, and disabled states.
- Confirm high-impact actions such as intercept where appropriate; do not make an alert-styled button accidentally trigger a destructive operation.

### Status badges

- Small rounded pills with a **soft semantic background** and stronger foreground text.
- Pair color with an icon, dot, or readable label (`NORMAL`, `ONLINE`, `ALERT`).
- Do not apply green styling to unknown or stale AIS data.

### Map controls and vessel markers

- Keep map action controls as floating light surfaces above imagery.
- Use clear vessel silhouettes/arrows with a contrasting stroke/halo so they work over both land and ocean.
- Selected vessel: distinct outline, selection ring, or larger marker; preserve heading orientation.
- Alerts should be visually distinguishable from ordinary vessels **without relying only on red**.
- Cluster dense markers at wider zooms; reveal individual vessels when zoomed in.
- Bottom controls: group `Vector`, `Satellite`, and `ENC` into a segmented control; selected mode uses a pale blue background.
- Anchor coordinate display and zoom controls consistently in the lower-right corner.
- Respect safe-area padding so UI does not overlap the map attribution or controls.

## 6. Interaction and accessibility rules

- **Contrast:** Aim for WCAG AA, at least **4.5:1** for normal text and **3:1** for large text and essential non-text controls. Verify token combinations in implementation, especially small muted labels.
- **Focus:** Visible 2px blue focus ring with offset; support keyboard traversal across navigation, floating dialogs, map controls, and actions.
- **States:** Always represent loading, no-data, stale AIS, connection loss, and errors explicitly.
- **Feedback:** When filters or tracking change, show clear state changes without unexpected modal interruptions.
- **Movement:** Avoid flashing/blinking markers. Smooth position updates are acceptable; respect reduced-motion preferences.
- **Information precision:** Use real timestamps, timezone labels, coordinate formats, and units. Never infer vessel health solely from a connected AIS stream.
- **Responsiveness:** Support desktop first, then adapt to touch and narrow screens without shrinking tap targets.

## 7. Visual consistency checklist

- [ ] UI surfaces use the shared neutral palette, not ad hoc whites/grays.
- [ ] Blue indicates interaction or data emphasis; red indicates an actionable problem.
- [ ] The map remains dominant; vessel cards have controlled width and height.
- [ ] Buttons, chips, tiles, and inputs use consistent spacing and radii.
- [ ] Labels and values align consistently in vessel detail rows.
- [ ] All status information has a text label, not just a colored dot.
- [ ] Vessel markers remain visible against changing map layers.
- [ ] Every interactive element has hover/focus/disabled behavior.
- [ ] Small typography is readable in real operational environments.
- [ ] Density and hierarchy remain useful at 1280px and smaller widths.

## 8. Recommended implementation approach

Create shared tokens first, then build primitives (`Button`, `Badge`, `Card`, `Input`, `NavItem`, `MetricTile`, `KeyValueRow`). Compose the `AppShell`, `MapToolbar`, and `VesselDetailsPanel` using those primitives. Keep map-layer colors and marker rendering rules separate from application UI tokens.

**Design intent in one sentence:** A bright, calm control-room interface that lets operators interpret vessel activity quickly while keeping critical events unmistakable.
