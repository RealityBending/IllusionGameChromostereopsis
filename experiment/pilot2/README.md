# Chromostereopsis pilot 2

**In design**: not yet online (see [Before collecting](#before-collecting)).

Plain HTML/JS, no dependencies. Open `index.html` locally to try the task (`?task=2` to skip to task
2). Check each task's stimuli in its `stimuli.html` ([task 1](task1_size/stimuli.html),
[task 2](task2_depth/stimuli.html); open locally, no server needed): they draw them with this
folder's own code and designs, so they always show the current levels.

## Aims

These follow the study's aims ([main README](../../README.md)), and give a first indication on its
viability criteria ([`AGENTS.md`](../../AGENTS.md#aim)).

1. **Primary: does the size bias depend on perceived depth?** Each participant's current depth
   percept (task 2) is matched with their size bias (task 1), in the same session and viewing
   conditions. Pilot 2 is the first to make this comparison.
2. **Secondary, a more sensitive size task**: smaller size differences (0.01 added; pilot 1's
   smallest was 0.025), so that more trials sit near threshold, where a small bias should show most;
   and finer illusion strength (7 levels instead of 5).
3. **Secondary, stimulus conditions: dither density at a fixed dither size**: most parameters are
   now fixed from pilot 1 ([Shared settings](#shared-settings)), including dither size at 4 px, the
   only factor with a tentative moderating effect in pilot 1 (weaker at 2 px; p = 0.07 after
   correction). Density is tested at that size. As density 1 is solid, this also tests whether dither
   matters at all (pilot 1 found no difference, but with dither size varying alongside). **Still to
   choose** between two designs: [`task1_size/density_options.md`](task1_size/density_options.md).

Practical: session length, data saving, and whether the instructions are followed.

## The session

Two tasks in one session, so that depth and size are measured under the same viewing conditions:

| Task | What | Trials | README |
| ---- | ---- | ------ | ------ |
| 1, size | Main task. Two discs side by side: which is larger? | 252 | [`task1_size/`](task1_size/README.md) |
| 2, depth | One disc at a time: does the circle or the surrounding area look nearer? | 24 | [`task2_depth/`](task2_depth/README.md) |

Flow: consent > demographics > task 1 instructions with two examples > 4 size blocks with breaks >
task 2 instructions > depth trials > end screen (task 1 accuracy and RT; how often red or blue
looked in front, naming chromostereopsis; saves to Zenodo, offers JSON/CSV download). A 500 ms
achromatic noise mask follows each response in both tasks, to cut the colour afterimage.

## Files

| File | What |
| ---- | ---- |
| `task1_size/design.js` | Task 1: `DESIGN` and `makeTrials()`, plus the helpers and settings shared with task 2 (fixed stimulus options, exclusions, fixation, mask). |
| `task2_depth/design.js` | Task 2: `DEPTH_DESIGN`, `makeDepthTrials()` and the trial-order rules. |
| `stimulus.js` | Port of Pyllusion's chromostereopsis parameters and image functions, plus `outline` (not in Pyllusion). A trial can be re-rendered from its `Seed`. |
| `experiment.js` | Screens, timing, data, saving; both tasks, in sections. |
| `index.html` | Page, demographics form, instructions for both tasks. |
| `task1_size/stimuli.html`, `task2_depth/stimuli.html` | Previews of each task's stimuli. Not part of the task. |
| `vendor/datapipe-client.js` | DataPipe client, the only third-party file. |

## Shared settings

Held fixed (`DESIGN.fixed`), in both tasks unless noted:

| Fixed | Value |
| ----- | ----- |
| `equiluminant` | true |
| `gap` | 0.01 |
| `size` | 0.5 (task 2 varies it: 0.5, 1) |
| `dither_size` | 4 px |
| `size_panel` | fill |

**Gap**: with no gap, screens may show a purple seam where red meets blue due to display
rendering, so pilot 2 uses a thin 0.01 gap.

## Changes from pilot 1

Parameter levels side by side: [main README](../../README.md#design-by-pilot). Also changed:

- **Exclusions**: pilot 1 excluded strength 0 with gap 0; pilot 2 excludes density 0.1 without the
  outline, and density 1 with it (a repeat of density 1 without).
- **Data file**: `chromostereopsis_pilot2_<start>_<id>.json`, with `session.pilot = 2`.

## Data

One JSON per session, as in pilot 1, with `session` (ids, times, device, canvas/screen size,
`pilot`, and `start_task`, 2 for a `?task=2` test run), `demographics`, `design` (the settings used,
task 2's under `design.depth`), `trials` (task 1) and, new, `depth_trials` (task 2). Every trial
carries `task` (`size` or `depth`); the fields of each are listed in its task's README. The CSV
download is the same, flattened, both tasks in one table.

## Saving

Through [DataPipe](https://pipe.jspsych.org) to Zenodo, as
`[test_]chromostereopsis_pilot2_<start, UTC>_<participant_id>.json`; an abandoned session leaves a
`...partial.json`. Fetch with `python data/download.py --pilot 2` (on the machine where
`data/pilot2/raw` resolves; needs a Zenodo token, see the script's header).

The DataPipe client is vendored, not loaded from a CDN, so it cannot change during a study:
`datapipe-client@0.2.0`, sha256 `b2af030b77d8ccc6619582691dd94022b8d388230186b1a24cc736939774310c`
(same as pilot 1).

## Before collecting

- Choose density option A or B ([`task1_size/density_options.md`](task1_size/density_options.md)).
- Decide whether task 2 keeps no time limit (the stimulus stays until the response; RT is recorded)
  or uses a fixed exposure.
- Set up a new DataPipe experiment and Zenodo deposit: `DATAPIPE_EXPERIMENT` in `experiment.js`
  (currently empty, so the end screen asks participants to download their file instead) and
  `DEPOSITS[2]` in `data/download.py`. Then add both ids to [Saving](#saving).
- Once pushed, add the live link
  (`https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/pilot2/`, `?test` for a
  test run) here and in the main README's Pilots table.
- Set up `analysis/pilot2/` (see each task's Analysis section).
- Run through both tasks on a touch screen (done on keyboard).

## Caveats

As in pilot 1: chromostereopsis likely depends on the display, viewing distance and lighting, none
of which are controlled online; they are recorded instead. The canvas fits the window, so retinal
size varies with viewing distance. `dither_size` is in pixels, so its visual angle varies too.
