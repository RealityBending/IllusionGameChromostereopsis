# Chromostereopsis pilot 1

**Frozen** (git tag `pilot1`): don't change the code here.

Plain HTML/JS, no dependencies. Live at
<https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/pilot1/>; add `?test` (or
open `index.html` locally) for a run that is saved as a test.

## Task

Two panels, each a dithered disc on a surround of the other colour (red on blue, blue on red).
Participants report **which disc is larger** (arrow keys, or tap left/right). No depth report is
collected; any illusion should appear as an asymmetry in errors and RTs between the two signs of
`illusion_strength`.

Flow: consent > demographics > instructions with two examples > 4 blocks with breaks > end screen
(saves to Zenodo, offers JSON/CSV download). A 500 ms achromatic noise mask follows each response,
to cut the colour afterimage.

## Files

| File | What |
| ---- | ---- |
| `stimulus.js` | Port of Pyllusion's chromostereopsis parameters and image functions. A trial can be re-rendered from its `Seed`. |
| `design.js` | `DESIGN` and `makeTrials()`. |
| `experiment.js` | Screens, timing, data, saving. |
| `index.html` | Page, demographics form, instructions. |
| `vendor/datapipe-client.js` | DataPipe client, the only third-party file. |

## Design

250 trials: 10 sets of 25, each set fully crossing:

- `difference` (area difference, positive = left larger): 0.025, 0.05, 0.1, 0.25, 0.5, sign
  balanced
- `illusion_strength` (sign = which side has the red-leaning disc; 0 = both panels the same purple,
  i.e. baseline bias): -1, -0.5, 0, 0.5, 1

Other factors are assigned within each set by balanced randomisation (not crossed):

| Factor | Levels |
| ------ | ------ |
| `size` | 0.25, 0.5, 0.75 |
| `gap` | 0, 0.02, 0.06 |
| `density` | 0.5, 0.75, 1 |
| `equiluminant` | false, true |
| `dither_size` | 2, 4, 8 (px) |
| `size_panel` | fill, "match" |

Excluded: `illusion_strength = 0` with `gap = 0` (the disc would be invisible). Rationale for each
factor: [`AGENTS.md`](../../AGENTS.md).

## Data

One JSON per session: `session` (ids, times, device, canvas/screen size), `demographics`, `design`
(the `DESIGN` used) and `trials` (response, RT, correctness, and the full Pyllusion parameter
dictionary, including `Seed` and the luminance covariates). The CSV download is the same, flattened.

## Saving

Sessions go through [DataPipe](https://pipe.jspsych.org) (experiment `Xykm83c1D95D`) to Zenodo
deposit [22944626](https://zenodo.org/uploads/22944626), as
`[test_]chromostereopsis_<start, UTC>_<participant_id>.json`. Trials are also streamed as they run,
so an abandoned session leaves a `...partial.json`. Fetch with `python data/download.py --pilot 1`
(needs a Zenodo token; see the script's header).

The DataPipe client is vendored, not loaded from a CDN, so it cannot change during a study:
`datapipe-client@0.2.0`, sha256 `b2af030b77d8ccc6619582691dd94022b8d388230186b1a24cc736939774310c`.

## Caveats

Chromostereopsis likely depends on the display, viewing distance and lighting, none of which are
controlled online; they are recorded instead. The canvas fits the window, so retinal size varies
with viewing distance.
