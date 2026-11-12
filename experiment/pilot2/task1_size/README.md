# Pilot 2, task 1: size task

The main task, run first in the [pilot 2](../README.md) session, before
[task 2, depth](../task2_depth/README.md).

## Aim

Task 1 measures the **size bias**: whether a red disc (on blue) is judged larger or smaller than an
equally sized blue disc (on red). Aims:

1. **Smaller size differences.** Adds 0.01 (pilot 1's smallest was 0.025), so that more trials sit
   near threshold.
2. **Finer illusion strength.** 7 levels instead of 5.
3. **Further testing of stimulus parameters.** Some are now fixed from pilot 1; others are retested
   with changes in line with these: dither density, and a coloured outline (`outline`), which lets
   low density be tested (below). **Still to choose** between option A (density 0.1, 0.5 and 1, with
   and without the outline; what `design.js` runs now) and option B (density 0.2 to 1 in steps of
   0.2, no outline): see [`density_options.md`](density_options.md).

**Why the coloured outline:** it is there to make low-density dither usable at all. A sparsely
dithered disc has no clear edge (at density 0.1, 9 in 10 cells are black), so its size cannot be
judged. The coloured outline, in the disc's own colour, gives it a defined edge while the inside
stays sparse. 

## Task

As in [pilot 1](../../pilot1/README.md): two discs side by side, each on a surround of the other
colour. Which is larger? <kbd>&larr;</kbd>/<kbd>&rarr;</kbd>, tap a half of the screen, or click the dim "Left larger" /
"Right larger" buttons under the stimulus (a reminder of the keys, as in task 2), as fast as
possible. 4 blocks with breaks. Unlike pilot 1, no accuracy or RT on the break screens: shown only
on the end screen, so that participants do not change how they judge size to raise a score that the
illusion lowers. The breaks do not mention blocks either.

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
grid. Logged as `Density` and `Outline`. **Provisional** until checked in
[`stimuli.html`](stimuli.html), which still shows the excluded combinations, marked EXCLUDED. An
alternative (density 0.2 to 1 in steps of 0.2, no outline) is set out in
[`density_options.md`](density_options.md).

| | No outline | Coloured outline (0.01) |
| - | ---------- | ----------------------- |
| Density 0.1 | excluded | yes |
| Density 0.5 | yes | yes |
| Density 1 | yes | excluded (same image) |

**Excluded**, at every strength:

- **Density 0.1 without the coloured outline.** 9 in 10 dither cells are black, so the gap is lost
  and the disc's edge is only where the dot colour changes, too ill-defined to judge size by (and
  invisible at strength 0).
- **Density 1 with the coloured outline.** The outline is invisible on a solid disc, so it is the
  same image as density 1 without it. It is not repeated: density 1 serves as the solid reference
  for both the with- and without-outline comparisons.

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
