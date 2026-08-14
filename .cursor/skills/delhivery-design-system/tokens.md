# Tokens

`tokens.json` is the source of truth. `tokens.css` is generated from it — edit
the JSON and run `npm run tokens:build`.

Component CSS must reference these `--ds-*` names and never a raw value. A value
used by only one component belongs in that component's CSS as a `--<component>-*`
property, not here.

## Spacing

Named by value: `--ds-space-6` is 6px.

<!-- GENERATED:space -->
| Token | Value |
|---|---|
| `--ds-space-0` | 0px |
| `--ds-space-2` | 2px |
| `--ds-space-4` | 4px |
| `--ds-space-6` | 6px |
| `--ds-space-8` | 8px |
| `--ds-space-12` | 12px |
| `--ds-space-14` | 14px |
| `--ds-space-16` | 16px |
| `--ds-space-20` | 20px |
| `--ds-space-24` | 24px |
| `--ds-space-32` | 32px |
| `--ds-space-40` | 40px |
| `--ds-space-48` | 48px |
| `--ds-space-64` | 64px |
| `--ds-space-80` | 80px |
<!-- /GENERATED:space -->

## Variant colours

Background and text pairs, one per variant. These drive the solid type.

<!-- GENERATED:variants -->
| Variant | Background | Text |
|---|---|---|
| `black` | `#000000` | `#e6e6e6` |
| `white` | `#ffffff` | `#2b2b2b` |
| `coal` | `#64739b` | `#f2f2f2` |
| `dlvRed` | `#ed1b36` | `#f2f2f2` |
| `info` | `#2396fb` | `#f2f2f2` |
| `success` | `#1ba86e` | `#f2f2f2` |
| `warning` | `#f5c828` | `#7b6414` |
| `error` | `#dc143c` | `#f2f2f2` |
| `cardbox` | `#b88b5c` | `#e6e6e6` |
<!-- /GENERATED:variants -->

## Palette

Neutrals, plus the tint ramps used by the subtle and outlined types.

<!-- GENERATED:palette -->
- `--ds-color-black` #101828
- `--ds-color-white` #ffffff
- `--ds-color-grey-50` #f9fafb
- `--ds-color-grey-100` #f2f4f7
- `--ds-color-grey-200` #e4e7ec
- `--ds-color-grey-300` #d0d5dd
- `--ds-color-grey-400` #98a2b3
- `--ds-color-grey-500` #667085
- `--ds-color-grey-600` #475467
- `--ds-color-coal-50` #eef1f8
- `--ds-color-coal-200` #c6cde3
- `--ds-color-coal-700` #3a4462
- `--ds-color-dlv-red-50` #fdebec
- `--ds-color-dlv-red-200` #f7c2c5
- `--ds-color-dlv-red-500` #e1252c
- `--ds-color-dlv-red-700` #9e161c
- `--ds-color-info-50` #eaf4fd
- `--ds-color-info-200` #bcdcf8
- `--ds-color-info-500` #1a7fd4
- `--ds-color-info-700` #10507f
- `--ds-color-success-50` #e7f6ef
- `--ds-color-success-200` #b3e3cd
- `--ds-color-success-500` #0f8a5f
- `--ds-color-success-700` #08543a
- `--ds-color-warning-50` #fdf5e0
- `--ds-color-warning-200` #f8e3a8
- `--ds-color-warning-700` #8a6d00
- `--ds-color-error-50` #fdeaef
- `--ds-color-error-200` #f8bfd0
- `--ds-color-error-700` #85103b
- `--ds-color-cardbox-50` #f7f0e6
- `--ds-color-cardbox-200` #e5d0b0
- `--ds-color-cardbox-700` #6b4f2d
<!-- /GENERATED:palette -->

## Radius, borders, motion and weight

<!-- GENERATED:other -->
| Token | Value |
|---|---|
| `--ds-radius-sm` | 3px |
| `--ds-radius-md` | 4px |
| `--ds-radius-full` | 999px |
| `--ds-border-width` | 1px |
| `--ds-status-dot-color` | #1ba86e |
| `--ds-font-weight-medium` | 500 |
| `--ds-font-weight-semibold` | 600 |
| `--ds-duration-fast` | 120ms |
<!-- /GENERATED:other -->

## Typography

`--ds-font-family` is Noto Sans with a system fallback stack, self-hosted via
`@fontsource/noto-sans` and imported in `src/main.tsx`.
