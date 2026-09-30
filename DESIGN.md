# Design

Direction approved 2026-09-30. Tokens live in `src/theme/tokens.ts` once created (step 2); this file is the source of intent.

## Theme
Dark only. Scene: a lifter checking in between sets under gym lighting, glare on the screen. Near-black surfaces, bright text.

## Color (OKLCH, restrained)
- Background: oklch(0.16 0.01 120), near-black tinted slightly toward the accent hue.
- Surface: oklch(0.21 0.012 120). Raised: oklch(0.26 0.014 120).
- Ink: oklch(0.96 0.01 120). Muted ink: oklch(0.76 0.012 120), never below 4.5:1 on background.
- Accent: acid lime-yellow, oklch(0.88 0.19 120). Used for primary actions, heat-map intensity, active tab. At most 10% of any screen.
- Danger: oklch(0.68 0.2 25).
- Heat ramp: background surface to accent in 4 steps, single hue, no gradient to another hue.

## Type
- Display and numerals: condensed grotesque (Barlow Condensed or Big Shoulders Display), bold.
- Text: Source Sans 3.
- Load via `expo-font`. Heading size ceiling 6rem equivalent; body line length under 75ch.

## Spacing and shape
- Scale: 4, 8, 12, 16, 24, 32, 48. Nothing else.
- Radii: 8 controls, 16 surfaces. No colored side borders. No nested cards. Prefer open layout over card grids.

## Motion
- Easing: out `cubic-bezier(0.23, 1, 0.32, 1)`, in-out `cubic-bezier(0.77, 0, 0.175, 1)`. No ease-in, no bounce beyond 0.1 to 0.3 on drag springs.
- Press: scale 0.97, 100 to 160 ms. UI transitions under 300 ms, exits faster than enters.
- No animation on logging a set. Reveals never gate visibility. Reduced motion: crossfade only, 3D idle spin off.
- Reanimated for UI-thread motion; animejs tweens plain objects that drive R3F props.

## 3D
- `@react-three/fiber/native` with `expo-gl`. One Canvas per screen, `frameloop="demand"` unless dragging.
- Scenes: body heat map (Gym Hub), water vessel (Home), load dial (workout), tab-bar pill. Each has a flat fallback and an accessible label.
- Web: 3D disabled behind `Platform.OS !== 'web'`.
