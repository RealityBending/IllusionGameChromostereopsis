# Pilot 2, task 2: depth task

New in pilot 2. Runs straight after [task 1](../task1_size/README.md) in the same session, so depth
can be linked to size. Try it alone with `index.html?task=2`.

## Aim

**Classify each participant** as red nearer, blue nearer, or no depth: a grouping for the size
analysis, and a count of interest in itself.

Kept short, with no dither. Dither is tested in task 1; in the main (non-pilot) experiment, task 2
can use whichever dither gives the strongest effect there.

A depth report has no correct answer, so it cannot replace the size task. It comes after it so the
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
- "No difference" is there for two reasons: 10-20% of observers see no depth, and on purple trials
  the circle and surround are the same colour, so there is no colour difference to see depth in.
- "Surrounding area" (button: "Surround nearer"), not "background", which implies behind.
- No time limit: the stimulus stays until the response, then the 500 ms mask. RT is recorded
  (e.g. to spot answers given without looking). The instructions do not mention time.

## Design

`DEPTH_DESIGN` in [`design.js`](design.js); preview in [`stimuli.html`](stimuli.html). The full stimulus is drawn (so it re-renders from its
`Seed`) and its left panel copied to the centre, so the sign of `illusion_strength` is the disc's
colour: + red on blue, - blue on red, 0 all purple.

48 trials, solid (density 1, no dither), no outline, otherwise as task 1. Disc size varies: 0.5
(as task 1), 0.75 and 1, so that fewer trials are identical repeats. There are likely too few
trials per size to test a difference between sizes.

Test runs can override `size`, `gap`, `density` or `equiluminant` in the URL, e.g.
`index.html?task=2&size=0.75&gap=0` (a varied factor is then held at that value).

| Per size (0.5, 0.75, 1) | Trials |
| ----------------------- | ------ |
| Red disc on blue (+1) | 7 |
| Blue disc on red (-1) | 7 |
| All purple (0) | 2 |

- **Full strength only**: it classifies best; lower strengths, dither and `outline` are left to
  task 1.
- **Trial count**: 42 red + blue trials (all sizes together) to classify each participant's depth
  direction. Raise `n_reps` if participants turn out less consistent than hoped.
- **Purple** measures the figure-in-front bias. The red vs blue comparison already cancels it, so
  it is only a check.

### Trial order

Random, with three rules (`orderDepthTrials()`):

1. Never the same trial twice in a row (same colour and size: with solid discs, the same image).
2. At most 2 in a row of the same disc colour (`max_run`), so repeating the last answer cannot pass
   for a consistent percept.
3. No purple before the first red and first blue disc (`colored_before_purple`). With circle and
   surround the same colour the question can seem meaningless, which would confuse participants
   before they have seen what the task is about.

## Data

`depth_trials`, one entry per trial (`task: "depth"`): `disc_color` (`red`/`blue`/`purple`),
`depth_answer` (`circle`/`surround`/`none`), `nearer_color` (`red`/`blue`/`none`, null if a side was
chosen on purple), `rt`, `panel_shown`, timing, response modality and `parameters`. Settings under
`design.depth`; partial files stage these as `"record": "depth_trial"`.

## Analysis

Classify each participant from their 42 red and blue disc trials. An answer **points to red** if it
is "circle nearer" on a red disc or "surround nearer" on a blue disc, and **points to blue** the
other way round. Someone who always answers "circle" points to red and blue equally, so the
figure-in-front bias does not decide the class.

- **Red nearer**: clearly more answers point to red than to blue.
- **Blue nearer**: the reverse.
- **No depth**: mostly "No difference".
- **Unclear**: anything else.

Keep it conservative and put anyone borderline in Unclear. Choose the cut-offs from the task 2
answers alone and record them before comparing the classes on the
task 1 size data. Optionally, check that a slightly stricter and a slightly looser cut-off give
similar results. Report the counts in each class. The classes are used in step 6 of the
[task 1 analysis](../task1_size/README.md#analysis).

Checks: on purple trials, the share of "circle nearer" and of "No difference" (whether the task was
understood); very fast answers (e.g. under ~300 ms), possibly given without looking.
