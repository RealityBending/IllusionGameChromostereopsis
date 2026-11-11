# Pilot 2, part 1: size task

The main task, run first in the [pilot 2](../README.md) session, before
[part 2, depth](../part2_depth/README.md).

## Aim

Part 1 measures the **size bias**: whether a red disc (on blue) is judged larger or smaller than an
equally sized blue disc (on red). Two questions about the disc's texture:

- **Does dither density change the size bias?** Density 0.1, 0.5 and 1 (solid).
- **Does the coloured outline (`outline`) change the size bias on its own?** The outline is there so
  that low density can be tested at all (below); this checks that it does not alter the size bias by
  itself.

**Why the coloured outline:** it is there to make low-density dither usable at all. A sparsely
dithered disc has no clear edge (at density 0.1, 9 in 10 cells are black), so its size cannot be
judged. The coloured outline, in the disc's own colour, gives it a defined edge while the inside
stays sparse. Low-density trials without it would not work, so **density 0.1 is only shown with the
coloured outline**. The outline is invisible at density 1, so outline vs no outline can only be
compared at density 0.5.

Also: `illusion_strength` in finer steps (7 levels instead of 5), and a harder `difference` (0.01).

## Task

As in [pilot 1](../../pilot1/README.md): two discs side by side, each on a surround of the other
colour. Which is larger? <kbd>&larr;</kbd>/<kbd>&rarr;</kbd> or tap a half of the screen, as fast as
possible. 4 blocks with breaks.

## Design

`DESIGN` in [`design.js`](design.js). 252 trials: 6 sets of 42, each crossing:

- `difference` (positive = left larger): 0.01, 0.025, 0.05, 0.1, 0.25, 0.5
- `illusion_strength` (sign = side of the red disc; 0 = all purple): -1, -0.67, -0.33, 0, 0.33,
  0.67, 1

So 36 trials per signed strength, 72 per colour pair. Which side is larger is balanced within each
strength of a set, each difference x strength cell, and each difference (`signPlan()`; needs an
even number of sets).

**Density (0.1, 0.5, 1) x `outline` (0, 4 px)**, minus density 0.1 without the coloured outline: 5
combinations, balanced within each set (8 or 9 each, about 50 per session), not crossed with the
grid. At density 1 the two outline levels are identical images, a built-in check. Logged as
`Density` and `Outline`. **Provisional** until checked in [`stimuli.html`](stimuli.html), which
still shows the excluded combination, marked EXCLUDED.

**Excluded**: density 0.1 without the coloured outline, at every strength. 9 in 10 dither cells are
black, so the gap is lost and the disc's edge is only where the dot colour changes, too ill-defined
to judge size by (and invisible at strength 0). So:

| | No outline | Coloured outline (4 px) |
| - | ------- | ----------- |
| Density 0.1 | excluded | yes |
| Density 0.5 | yes | yes |
| Density 1 | yes | yes (identical to no outline) |

`outline` sits inside the disc's radius, so it does not change its size. Fixed settings: [pilot 2
README](../README.md#shared-settings). Rationale for each factor: [`AGENTS.md`](../../../AGENTS.md).

## Data

`trials`, one entry per trial (`task: "size"`): `response`, `correct_response`, `correct`, `rt`, set,
block, timing, response modality and `parameters` (including `Seed`, `Density`, `Outline` and the
luminance covariates).

## Analysis

Adapt `analysis/pilot1/analysis.qmd` into `analysis/pilot2/`: test `Density`, `Outline` and their
interaction instead of pilot 1's six factors. Group participants by their part 2 classification
(red nearer, blue nearer, no depth), so that opposite size biases are not averaged out.
