# BabyNest Brand & UI Guide

This guide describes the visual language currently used in BabyNest, a pregnancy
and postpartum tracking app with health records, tasks, appointments, and an
AI-assisted chat experience. Use it to keep new screens consistent with the
existing product; where the implementation is not yet consistent, follow the
recommendations below and call out intentional departures.

## Design Principles

- **Reassuring and supportive:** Use a warm, gentle visual tone for a personal
  health journey. Avoid alarmist language or visual treatment except where an
  urgent action genuinely requires it.
- **Clear before decorative:** Pregnancy week, appointment, task, and health
  information should be easy to scan. Keep labels concise and make important
  actions visually distinct.
- **Friendly, not childish:** Soft pinks, rounded cards, and pregnancy-related
  illustrations create warmth. Keep health information and controls readable
  and respectful.
- **Private and personal:** Present profile and health information with care.
  Do not expose sensitive details in decorative elements or unnecessary
  notifications.
- **Accessible and predictable:** Use clear contrast, readable type, familiar
  icons, and consistent placement and behavior for navigation and actions.
  Color must not be the only way to communicate status or priority.
- **Responsive:** The app is React Native and runs on multiple screen sizes.
  Respect safe areas, allow content to scroll, and adapt spacing and artwork
  rather than clipping important information.

## Color Palette

The default app appearance is a soft blush canvas with rose-pink accents and
white cards. Use the values below as the reference palette for new default-theme
work.

| Role | Color | Usage |
| --- | --- | --- |
| Primary rose | `#DA4F7A` (`rgb(218, 79, 122)`) | Primary actions, selected states, key icons, and highlights |
| Soft blush background | `#FFF5F8` | Main pregnancy/home screen background |
| Pale rose surface | `#FFEEF2` | Secondary highlights and unselected pregnancy-week bubbles |
| White | `#FFFFFF` | Cards and clean content surfaces |
| Primary text | `#000000` / `#333333` | Main titles and prominent content (varies by screen) |
| Secondary text | `#555555` / `#666666` | Supporting details and onboarding copy |
| Muted control | `#DDDDDD` / gray | Inactive pagination and navigation states |
| On-accent text | `#FFFFFF` | Text and icons on filled rose controls |

There is a visible bright-pink variation (`#FF4081`) in onboarding indicators,
onboarding actions, and the bottom-tab selected state. Prefer the default
primary rose `#DA4F7A` for new shared UI unless matching one of those existing
surfaces.

### Additional theme palettes in the source

`src/theme/ThemeContext.js` defines `default`, `light`, `dark`, and `pastel`
palettes. Their current values are:

| Theme | Primary | Background | Text | Notes |
| --- | --- | --- | --- | --- |
| Default | `#DA4F7A` | `#FFF5F8` | `#000000` | The main app palette |
| Light | `#D4A373` | `#FFFFFF` | `#000000` | Earthy accent with sage cards |
| Dark | `#9E2A2B` | `#FFFFFF` | `#FFF3B0` | Defined in source, but not a conventional dark appearance |
| Pastel | `#AC87C5` | `#FFFFFF` | `#5F5F5F` | Lavender and soft pink surfaces |

Theme support is partial: the context starts with `default`, exposes an update
function, and is currently consumed by the chat screen. Most screens use
hard-coded colors instead of shared theme values. In particular, do not describe
the existing `dark` palette as a complete dark mode or assume a theme choice is
persisted or applied throughout the app. Check contrast and integration on
every affected screen when changing theme behavior.

## Typography

- No custom font family is specified in the inspected UI. Use the platform's
  native sans-serif typeface rather than introducing a new font without a
  design decision.
- The existing hierarchy is based on size and weight:
  - Screen or app title: around `22–26` with bold weight.
  - Section heading: around `18` with bold weight.
  - Card title: around `16` with bold weight.
  - Body and supporting copy: around `14–16`, typically regular weight.
  - Small metadata: around `14` or below where legibility permits.
- Onboarding scales selected dimensions relative to a 375-point-wide layout;
  preserve responsive sizing and comfortable line spacing when extending it.
- Use sentence case for labels and section headings. Reserve all caps for brief,
  established onboarding actions such as “SKIP” and “NEXT”.

## Layout & Shapes

- Favor a simple vertical reading flow with clear sections, generous spacing,
  and scrollable content.
- Use white cards on the blush background to group related information such as
  baby progress, appointments, and weekly tasks. The home screen uses both
  softly elevated cards and rounded surfaces.
- Rounded corners are a recurring motif: roughly `12` for compact cards and
  `16–20` for larger surfaces; use circular shapes for avatars, week markers,
  and floating actions.
- Primary actions may use a filled rose background with white content. Use
  accent-colored text or icons for secondary actions and selected states.
- Keep controls comfortably tappable. Preserve safe-area spacing and avoid
  placing content beneath floating buttons or navigation.
- Use spacing and alignment consistently within a screen; do not add borders,
  shadows, or decorative containers unless they clarify grouping or hierarchy.
- Prefer the existing lightweight elevation treatment over heavy shadows.

## Illustration, Imagery & Iconography

- The onboarding artwork uses warm, flat vector illustrations showing pregnancy,
  care, and parenthood. Keep new illustrations friendly, inclusive, and
  supportive, with soft forms and a restrained palette.
- Use photography sparingly and only where it helps personalize the experience
  (for example, profile imagery). Do not let imagery compete with health data.
- The app uses Ionicons and Material Icons. Reuse the installed icon sets and
  familiar metaphors for navigation and common actions; pair unfamiliar or
  high-impact icons with a text label.
- Keep icon size, stroke/visual weight, and accent color consistent within a
  navigation area or control group. Provide accessible labels for
  icon-only actions.

## Theme Support

- The default BabyNest identity is rose-on-blush with white surfaces. New UI
  should match this appearance unless it is intentionally implementing another
  palette.
- When modifying themed UI, use the existing `ThemeContext` where appropriate
  and ensure text, icons, controls, cards, and status/navigation states all
  remain legible together.
- Do not assume every screen responds to theme changes. Verify the specific
  screen and its surrounding navigation because most screens currently define
  their colors locally.
- A complete dark theme requires a dark background/surface hierarchy and
  verified foreground contrast; the current `dark` palette does not yet meet
  that description.

## Before Opening a UI Pull Request

- Confirm that the UI follows the default blush, rose, and white visual
  language, or explain why a different treatment is needed.
- Check the screen at relevant small and large device sizes, including safe
  areas, scrolling, keyboard behavior where applicable, and overlapping
  floating controls.
- Verify text hierarchy, wrapping, and contrast. Do not rely on color alone to
  convey selection, urgency, or health status.
- Check touch target size and ensure icon-only controls have accessible labels.
- If using theme values, verify the theme is actually connected to the screen
  and check all affected theme variants; do not claim unsupported dark-mode
  coverage.
- Keep sensitive health and pregnancy content calm, factual, and easy to scan.
- Include screenshots for meaningful visual changes and describe any deliberate
  deviation from these guidelines in the pull request.