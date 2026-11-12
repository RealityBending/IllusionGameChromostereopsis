# Task 1 density: two options

Option A is the standard, and is what `design.js` runs. Option B is an alternative to choose
between. Compare them by eye in [`stimuli.html`](stimuli.html) (A) and
[`stimuli.html?option=b`](stimuli.html?option=b) (B).

Both use the same 252 trials, so the session length is the same. Only how the trials are split
between conditions changes.

## A: density x coloured outline (standard)

Density 0.1, 0.5 and 1, crossed with the coloured outline (none, or as wide as the gap). This gives
4 conditions of about 63 trials each.

| | No outline | Outline |
| - | - | - |
| 0.1 | excluded | yes |
| 0.5 | yes | yes |
| 1 | yes | excluded (repeat of density 1, no outline) |

**Pros**

- Tests very sparse dither (0.1), the strongest version of the dither claim, which the outline makes
  usable.
- Tests whether the outline changes the size bias by itself (at 0.5).

**Cons**

- Two factors share 4 conditions. Density and outline can only be separated through specific pairs
  of conditions, which makes the analysis more involved.
- The two extremes may not be directly comparable. At 0.1 the disc's edge comes mainly from the
  coloured outline, and at 1 from the solid fill against the black gap. A difference between them
  could partly reflect what defines the edge, rather than density alone.

## B: density only, 0.2 to 1 in steps of 0.2

Density 0.2, 0.4, 0.6, 0.8 and 1, with no coloured outline. This gives 5 conditions of about 50 trials
each (8 or 9 per set of 42).

**Pros**

- One factor, so no confound with the outline.
- Density is tested across most of its range, in even steps, and can be analysed as a continuous
  slope.
- Extends below pilot 1's lowest level (0.5), which found no difference between 0.5, 0.75 and 1
  (slopes 0.10, 0.08 and 0.11).

**Cons**

- No outline test, and nothing below 0.2. However, very sparse dither with outlined circles arguably
  constitutes a distinct stimulus, and may be better examined in a separate study.
- At strength 0, density 0.2 and 0.4 would have to be excluded: disc and surround are the same
  purple, and at these densities the circle cannot be made out well enough. Strength 0 trials would
  then only appear at 0.6, 0.8 and 1. This costs little, as they only give each participant's
  left/right baseline, but density would not be fully balanced against strength.

## Switching to B

In `design.js`:

```js
density_outline_all: [0.2, 0.4, 0.6, 0.8, 1].map((density) => ({ density, outline: 0 })),
```

and add to `exclude` (strength 0 trials are then moved to 0.6, 0.8 or 1 by swapping, keeping each
level's total):

```js
(o) => o.illusion_strength === 0 && o.density <= 0.4 && o.outline === 0,
```

The existing exclusion rules can stay: neither applies to these levels. Then update the task 1
README's Design section.
