# Pilot 2, task 1: size task

The main task, run first in the [pilot 2](../README.md) session, before
[task 2, depth](../task2_depth/README.md).

## Aim

Task 1 measures the **size bias**: whether a red disc (on blue) is judged larger or smaller than a
blue disc (on red). It is compared between task 2's depth classes for the pilot's primary aim
([pilot 2](../README.md#aims)). Task 1's own aims:

1. **Smaller size differences.** Adds 0.01 (pilot 1's smallest was 0.025), so that more trials sit
   near threshold.
2. **Finer illusion strength.** 7 levels instead of 5.
3. **Dither density, at a fixed dither size (4 px).** **Still to choose** between option A
   (density 0.1, 0.5 and 1, with and without a coloured outline; what `design.js` runs now) and
   option B (density 0.2 to 1 in steps of 0.2, no outline): [`density_options.md`](density_options.md).

**Why the coloured outline (option A):** a sparsely dithered disc has no clear edge, so its size
cannot be judged. The outline, in the disc's own colour, gives it one while the inside stays sparse.

## Task

As in [pilot 1](../../pilot1/README.md): two discs side by side, each on a surround of the other
colour. Which is larger? <kbd>&larr;</kbd>/<kbd>&rarr;</kbd>, a tap on either half of the screen,
or the dim "Left larger" / "Right larger" buttons under the stimulus (as in task 2), as fast as
possible. 4 blocks with breaks. Unlike pilot 1, accuracy and RT are shown only on the end screen, not
at breaks, so that participants do not change how they judge size to raise a score the illusion
lowers.

## Design

`DESIGN` in [`design.js`](design.js). 252 trials: 6 sets of 42, each crossing:

- `difference` (positive = left larger): 0.01, 0.025, 0.05, 0.1, 0.25, 0.5
- `illusion_strength` (sign = side of the red disc; 0 = all purple): -1, -0.67, -0.33, 0, 0.33,
  0.67, 1

So 36 trials per signed strength, 72 per colour pair. Which side is larger is balanced within each
strength of a set, each difference x strength cell, and each difference (`signPlan()`; needs an
even number of sets).

**Density (0.1, 0.5, 1) x `outline` (0, 0.01: as wide as the gap)**, minus two combinations, leaving **4 distinct
conditions**, balanced within each set (10 or 11 each, about 63 per session), not crossed with the
grid. Logged as `Density` and `Outline`. This is option A; see aim 3. Preview, with excluded
combinations marked: [`stimuli.html`](stimuli.html).

| | No outline | Coloured outline (0.01) |
| - | ---------- | ----------------------- |
| Density 0.1 | excluded | yes |
| Density 0.5 | yes | yes |
| Density 1 | yes | excluded (repeat of density 1, no outline) |

**Excluded**, at every strength:

- **Density 0.1 without the outline**: 9 in 10 cells are black, so the disc's edge is too
  ill-defined to judge size by (and invisible at strength 0).
- **Density 1 with the outline**: the outline is invisible on a solid disc, so this repeats density 1
  without it, which serves as the solid reference for both outline levels.

`outline` sits inside the disc's radius, so it does not change its size. Fixed settings: [pilot 2
README](../README.md#shared-settings). Rationale for each factor: [`AGENTS.md`](../../../AGENTS.md).

## Data

`trials`, one entry per trial (`task: "size"`): `response`, `correct_response`, `correct`, `rt`, set,
block, timing, response modality and `parameters` (including `Seed`, `Density`, `Outline` and the
luminance covariates).

## Analysis

Estimates with intervals (bootstrap, as in pilot 1), no significance tests. The size bias is the
`Illusion_Strength` effect in pilot 1's core model (a mixed logistic model of left/right responses,
with `difference`), in `analysis/pilot1/analysis.qmd`.

1. **Data quality and engagement**, first. Partial sessions are left out, as in pilot 1 (they are
   most likely test runs of the pilot). Pilot 1 reported each participant's accuracy, median RT and
   duration, and the design balance; add:
   - engagement: accuracy above chance overall, and near ceiling at the easiest difference (0.5);
   - response patterns: mostly one key, very fast responses (e.g. under 200 ms), very slow ones
     (e.g. over 5 s);
   - self-reports: colour or depth vision problems, device, viewing distance, lighting;
   - duration of each task, and the design balance (now 4 density/outline conditions).

   Flag rather than exclude, and check whether leaving the flagged participants out changes the
   picture.
2. **Size bias: direction and rough size.** The `Illusion_Strength` estimate from the core model
   (as in pilot 1), with its interval.
   - **Consistency within participants** (viability criterion 2 in
     [`AGENTS.md`](../../../AGENTS.md#aim)): estimate each participant's bias separately in the first
     and second half of the task (blocks 1-2 vs 3-4), and report how often the direction agrees.
     With about 126 trials per half this is rough, so treat it as a first indication.
3. **Does the bias grow with the colour separation?** The bias at each of the 7 strength levels,
   plotted (pilot 1 compared linear vs categorical strength).
4. **Difficulty.** Error rate at each `difference` (as in pilot 1). New: is 0.01 above chance? If
   not, the main experiment may drop it.
5. **Dither density and coloured outline.** The bias in each of the 4 conditions, with intervals,
   from one model (`Illusion_Strength` x condition), with density 1 as the solid reference for both
   outline levels. Look at density without the outline (0.5 vs 1), density with it (0.1 vs 0.5
   vs 1), and outline vs none (at 0.5). The aim is to choose the dither for the main experiment:
   look for a clearly stronger or weaker bias.
6. **Depth classes from [task 2](../task2_depth/README.md#analysis).** If people see depth in
   opposite directions, their size biases may cancel out when pooled.
   - Estimate the size bias within each depth class (red nearer, blue nearer, no depth), with
     intervals. Unclear participants (inconsistent answers) are left out of this step. As they
     depend on where the cut-offs are drawn, repeat this step with the looser cut-offs from task 2
     (which classify more participants).
   - For the red-nearer and blue-nearer participants, recode `Illusion_Strength` relative to the
     colour each sees as nearer (flip its sign for blue-nearer), and re-estimate the bias. Size
     constancy predicts that the disc seen as nearer is judged smaller; this pools both directions
     instead of cancelling them. Compare with step 2.
   - **No depth** (mostly "No difference") is a comparison group: if the size bias comes from
     perceived depth, these participants should show little or none. A bias as large as in the
     other classes would point to something other than perceived depth (e.g. the colours
     themselves, or optics that change apparent size without being seen as depth).
7. **Planning the main experiment.** From the above: the size of the bias and how much it varies
   between participants (for the sample size), which dither and `difference` levels to keep, how
   many participants fall in each depth class, and how long each task takes.
