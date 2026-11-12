# Pilot 2, task 2: depth task

New in pilot 2. Runs straight after [task 1](../task1_size/README.md) in the same session. Try it
alone with `index.html?task=2`.

## Aim

**Classify each participant's current depth percept** (red nearer, blue nearer or no depth), under
the same viewing conditions as their size judgements in task 1, so that the two can be matched.
Perceived depth likely depends on the screen, lighting and viewing distance, so it is measured in
the same session rather than treated as a fixed trait.

A depth report has no correct answer, so it cannot replace the size task. It comes after it, so that
size judgements are made before participants know the study is about depth. Rationale and other
options: [`AGENTS.md`](../../../AGENTS.md#measuring-perceived-depth).

## Task

One disc on its surround, centred. (Showing both panels was hard to judge: two discs cannot be
fixated at once.) Which looks nearer, the circle or the surrounding area?

| Answer | Key | Button |
| ------ | --- | ------ |
| circle | <kbd>&larr;</kbd> | Circle nearer |
| no difference | <kbd>&darr;</kbd> | No difference |
| surround | <kbd>&rarr;</kbd> | Surround nearer |

- On touch screens only the buttons count: half-screen taps cannot give three answers.
- "No difference" is there because 10-20% of observers see no depth.
- "Surrounding area" (button: "Surround nearer"), not "background", which implies behind.
- No time limit: the stimulus stays until the response, then the 500 ms mask. RT is recorded
  (e.g. to spot answers given without looking). The instructions do not mention time.

## Design

`DEPTH_DESIGN` in [`design.js`](design.js); preview in [`stimuli.html`](stimuli.html). The full stimulus is drawn (so it re-renders from its
`Seed`) and its left panel copied to the centre, so the sign of `illusion_strength` is the disc's
colour: + red on blue, - blue on red.

24 trials, solid (density 1, no dither), no outline, otherwise as task 1 (gap 0.01). Disc size
varies (0.5, as task 1, and 1) so that a colour can come up twice in a row without repeating the same
image; with one size, red and blue would have to alternate. Too few trials per size to compare
sizes. Cut from 48 trials (with purple), which took about 8 minutes.

Test runs can override `size`, `gap`, `density` or `equiluminant` in the URL, e.g.
`index.html?task=2&size=0.75&gap=0` (a varied factor is then held at that value).

| Per size (0.5, 1) | Trials |
| ----------------- | ------ |
| Red disc on blue (+1) | 6 |
| Blue disc on red (-1) | 6 |

- **Full strength only, solid**: it classifies best; lower strengths and dither are left to task 1.
  In the main experiment, task 2 can use whichever dither works best there.
- **Trial count**: raise `n_reps` if participants turn out less consistent than hoped.
- **No purple**: it only checked the figure-in-front bias, which the red vs blue comparison already
  cancels, and with no colour difference the question means little to participants.

### Trial order

Random, with two rules (`orderDepthTrials()`):

1. Never the same trial twice in a row (same colour and size: with solid discs, the same image).
2. At most 2 in a row of the same disc colour (`max_run`), so repeating the last answer cannot pass
   for a consistent percept.

## Data

`depth_trials`, one entry per trial (`task: "depth"`): `disc_color` (`red`/`blue`),
`depth_answer` (`circle`/`surround`/`none`), `nearer_color` (`red`/`blue`/`none`), `rt`,
`panel_shown`, timing, response modality and `parameters`. Settings under `design.depth`; partial
files stage these as `"record": "depth_trial"`.

## Analysis

Classify each participant from their 24 red and blue disc trials. An answer **points to red** if it
is "circle nearer" on a red disc or "surround nearer" on a blue disc, and **points to blue** the
other way round. Someone who always answers "circle" points to red and blue equally, so the
figure-in-front bias does not decide the class.

- **Red nearer**: clearly more answers point to red than to blue.
- **Blue nearer**: the reverse.
- **No depth**: mostly "No difference".
- **Unclear**: anything else.

Keep it conservative: anyone borderline is Unclear. Choose the cut-offs from the task 2 answers alone
and record them before looking at the task 1 data; optionally check that slightly stricter and looser
cut-offs agree. Report the number in each class (to read the comparison, not as an estimate of how
common each percept is). The classes are used in step 6 of the
[task 1 analysis](../task1_size/README.md#analysis).

Checks: the overall share of "circle nearer" (the figure-in-front bias, no longer measured on its
own); very fast answers (e.g. under ~300 ms), possibly given without looking.
