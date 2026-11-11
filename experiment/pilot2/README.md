# Chromostereopsis pilot 2

**In design**: not yet online (see [Before collecting](#before-collecting)).

Plain HTML/JS, no dependencies. Open `index.html` locally to try the task (`?part=2` to skip to part
2). Check each part's stimuli in its `stimuli.html` ([part 1](part1_size/stimuli.html),
[part 2](part2_depth/stimuli.html); open locally, no server needed): they draw them with this
folder's own code and designs, so they always show the current levels.

## The session

Two parts in one session, so each participant's depth report can be linked to their size data:

| Part | What | Trials | README |
| ---- | ---- | ------ | ------ |
| 1, size | Main task. Two discs side by side: which is larger? Tests whether dither density and a coloured outline change the size bias. | 252 | [`part1_size/`](part1_size/README.md) |
| 2, depth | One disc at a time: does the circle or the surrounding area look nearer? Classifies each participant (red nearer, blue nearer, no depth). Solid discs, no dither; disc size varies. | 48 | [`part2_depth/`](part2_depth/README.md) |

Flow: consent > demographics > part 1 instructions with two examples > 4 size blocks with breaks >
part 2 instructions > depth trials > end screen (saves to Zenodo, offers JSON/CSV download). A
500 ms achromatic noise mask follows each response in both parts, to cut the colour afterimage.

## Files

| File | What |
| ---- | ---- |
| `part1_size/design.js` | Part 1: `DESIGN` and `makeTrials()`, plus the helpers and settings shared with part 2 (fixed stimulus options, exclusions, fixation, mask). |
| `part2_depth/design.js` | Part 2: `DEPTH_DESIGN`, `makeDepthTrials()` and the trial-order rules. |
| `stimulus.js` | Port of Pyllusion's chromostereopsis parameters and image functions, plus `outline` (not in Pyllusion). A trial can be re-rendered from its `Seed`. |
| `experiment.js` | Screens, timing, data, saving; both parts, in sections. |
| `index.html` | Page, demographics form, instructions for both parts. |
| `part1_size/stimuli.html`, `part2_depth/stimuli.html` | Previews of each part's stimuli. Not part of the task. |
| `vendor/datapipe-client.js` | DataPipe client, the only third-party file. |

## Shared settings

Held fixed (`DESIGN.fixed`), in both parts unless noted:

| Fixed | Value |
| ----- | ----- |
| `equiluminant` | true |
| `gap` | 0.02 |
| `size` | 0.5 (part 2 varies it: 0.5, 0.75, 1) |
| `dither_size` | 4 px |
| `size_panel` | fill |

Part 2 also overrides `density` (1, solid) and `outline` (0). Also shared: the exclusion rule (no density 0.1 without the outline), the fixation
jitter (600-1100 ms) and the mask.

## Changes from pilot 1

| | Pilot 1 | Pilot 2 |
| - | ------- | ------- |
| `difference` | 0.025 to 0.5 (5 levels) | 0.01 to 0.5 (6 levels) |
| `illusion_strength` | -1 to 1 in 0.5 steps (5) | -1 to 1 in thirds (7) |
| `equiluminant` | false, true | true |
| `gap` | 0, 0.02, 0.06 | 0.02 |
| `size` | 0.25, 0.5, 0.75 | 0.5 (part 2: 0.5, 0.75, 1) |
| `dither_size` | 2, 4, 8 | 4 |
| `size_panel` | fill, "match" | fill |
| `density` | 0.5, 0.75, 1 | 0.1, 0.5, 1, crossed with `outline`, 0.1 only with it (provisional) |
| `outline` | n/a | 0, 4 px, crossed with `density` (provisional) |
| Left/right larger | balanced within each strength level | also within each difference size |
| Excluded combinations | strength 0 with gap 0 | density 0.1 without the outline |
| Trials | 10 sets of 25 = 250 | 6 sets of 42 = 252 |
| Depth task | none | 48 trials after the size task |
| Data file | `chromostereopsis_<start>_<id>.json` | `chromostereopsis_pilot2_<start>_<id>.json`, with `session.pilot = 2` |

## Data

One JSON per session, as in pilot 1, with `session` (ids, times, device, canvas/screen size,
`pilot`, and `start_part`, 2 for a `?part=2` test run), `demographics`, `design` (the settings used,
part 2's under `design.depth`), `trials` (part 1) and, new, `depth_trials` (part 2). Every trial
carries `task` (`size` or `depth`); the fields of each are listed in its part's README. The CSV
download is the same, flattened, both parts in one table.

## Saving

Through [DataPipe](https://pipe.jspsych.org) to Zenodo, as
`[test_]chromostereopsis_pilot2_<start, UTC>_<participant_id>.json`; an abandoned session leaves a
`...partial.json`. Fetch with `python data/download.py --pilot 2` (on the machine where
`data/pilot2/raw` resolves; needs a Zenodo token, see the script's header).

The DataPipe client is vendored, not loaded from a CDN, so it cannot change during a study:
`datapipe-client@0.2.0`, sha256 `b2af030b77d8ccc6619582691dd94022b8d388230186b1a24cc736939774310c`
(same as pilot 1).

## Before collecting

- Settle the `density` and `outline` levels from `part1_size/stimuli.html`, and check part 2's
  stimuli in `part2_depth/stimuli.html`.
- Decide whether part 2 keeps no time limit (the stimulus stays until the response; RT is recorded)
  or uses a fixed exposure.
- Set up a new DataPipe experiment and Zenodo deposit: `DATAPIPE_EXPERIMENT` in `experiment.js`
  (currently empty, so the end screen asks participants to download their file instead) and
  `DEPOSITS[2]` in `data/download.py`. Then add both ids to [Saving](#saving).
- Once pushed, add the live link
  (`https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/pilot2/`, `?test` for a
  test run) here and in the main README's Pilots table.
- Set up `analysis/pilot2/` (see each part's Analysis section).
- Run through both parts once (keyboard and touch): part 2 has not been run in a browser yet.

## Caveats

As in pilot 1: chromostereopsis likely depends on the display, viewing distance and lighting, none
of which are controlled online; they are recorded instead. The canvas fits the window, so retinal
size varies with viewing distance. `dither_size` and `outline` are in pixels, so their visual angle
varies too.
