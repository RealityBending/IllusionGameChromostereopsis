# Pilot 2, part 2: depth task

New in pilot 2. Runs straight after [part 1](../part1_size/README.md) in the same session, so depth
can be linked to size. Try it alone with `index.html?part=2` (skips everything before it; saved as a
test).

## Aim

**Classify each participant** as red nearer, blue nearer, or no depth: a grouping for the size
analysis, and a count of interest in itself.

Kept short, with no dither. Dither is tested in part 1; in the main (non-pilot) experiment, part 2
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
- "No difference" is there because 10-20% of observers see no depth.
- "Surrounding area" (button: "Surround nearer"), not "background", which implies behind.
- No time limit: the stimulus stays until the response, then the 500 ms mask. RT is recorded
  (e.g. to spot answers given without looking). The instructions do not mention time.

## Design

`DEPTH_DESIGN` in [`design.js`](design.js); preview in [`stimuli.html`](stimuli.html). The full stimulus is drawn (so it re-renders from its
`Seed`) and its left panel copied to the centre, so the sign of `illusion_strength` is the disc's
colour: + red on blue, - blue on red, 0 all purple.

48 trials, solid (density 1, no dither), no outline, otherwise as part 1. Disc size varies: 0.5
(as part 1), 0.75 and 1. Tried by eye, a small disc tends to look in front whatever its colour and
a large one lets the surround win, so varying it keeps the classification from depending on one
size. Size is not planned as a test, though it can be looked at descriptively.

Test runs can override `size`, `gap`, `density` or `equiluminant` in the URL, e.g.
`index.html?part=2&size=0.75&gap=0` (a varied factor is then held at that value).

| Per size (0.5, 0.75, 1) | Trials |
| ----------------------- | ------ |
| Red disc on blue (+1) | 7 |
| Blue disc on red (-1) | 7 |
| All purple (0) | 2 |

- **Full strength only**: it classifies best; lower strengths, dither and `outline` are left to
  part 1.
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

Depth direction per participant: share of "circle nearer" on red discs minus on blue discs (cancels
the figure-in-front bias). Classify as red nearer, blue nearer or no depth with a binomial test.
Report the counts, and use the grouping in the part 1 size analysis.
