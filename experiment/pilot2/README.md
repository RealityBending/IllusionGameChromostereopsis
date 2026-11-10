# Chromostereopsis pilot 2

**In design**: not yet online (see [Before collecting](#before-collecting)).

Plain HTML/JS, no dependencies. Open `index.html` locally to try the task. Check the stimuli in
[`stimuli.html`](stimuli.html) (open locally, no server needed): it draws them with this folder's own
`stimulus.js` and `DESIGN`, so it always shows the current levels.

## Aim

Pilot 2 narrows pilot 1's screen of six stimulus factors down to two questions about the disc's
texture:

- **Does dither density change the effect of chromostereopsis on size judgements?**
- **Does a solid coloured ring at the disc's edge (`outline`) change it?** A sparsely dithered disc
  has a ragged edge, which may make its size harder to judge; the ring keeps the edge defined.

The two are fully crossed, so the ring's effect can be seen at each density. Every other stimulus
factor is fixed.

> **NB:** the ring is invisible at density 1 (it is the disc's own colour), so any ring effect can
> only show at 0.5 and 0.1. 

It also samples `illusion_strength` more finely (7 levels instead of 5), to see how the size bias
grows with the red-blue separation, and adds a harder `difference` level (0.01).

## Task

As in [pilot 1](../pilot1/README.md). Two panels, each a dithered disc on a surround of the other
colour (red on blue, blue on red). Participants report **which disc is larger** (arrow keys, or tap
left/right). No depth report is collected; any illusion should appear as an asymmetry in errors and
RTs between the two signs of `illusion_strength`.

Flow: consent > demographics > instructions with two examples > 4 blocks with breaks > end screen
(saves to Zenodo, offers JSON/CSV download). A 500 ms achromatic noise mask follows each response,
to cut the colour afterimage.

## Files

| File | What |
| ---- | ---- |
| `stimulus.js` | Port of Pyllusion's chromostereopsis parameters and image functions, plus `outline` (not in Pyllusion). A trial can be re-rendered from its `Seed`. |
| `design.js` | `DESIGN` and `makeTrials()`. |
| `experiment.js` | Screens, timing, data, saving. |
| `index.html` | Page, demographics form, instructions. |
| `stimuli.html` | Stimulus preview, for choosing levels. Not part of the task. |
| `vendor/datapipe-client.js` | DataPipe client, the only third-party file. |

## Design

252 trials: 6 sets of 42, each set fully crossing:

- `difference` (area difference, positive = left larger): 0.01, 0.025, 0.05, 0.1, 0.25, 0.5
- `illusion_strength` (sign = which side has the red-leaning disc; 0 = both panels the same purple,
  i.e. baseline bias): -1, -0.67, -0.33, 0, 0.33, 0.67, 1

Which side is larger is balanced within each strength level of a set, within each difference x
strength cell across sets, and within each difference across the session (see `signPlan()` in
`design.js`; this needs an even number of sets).

Density (0.1, 0.5, 1) and `outline` (0 = none, 4 px) are fully crossed with each other, giving 6
combinations, and assigned within each set by balanced randomisation (not crossed with the grid
above): 7 of each per set, 42 per session. At density 1 the ring is invisible, so the two outline
levels there are identical images, a built-in check that any ring effect comes from the lower
densities. In `design.js` this is the single factor `density_outline`; each trial still logs
`Density` and `Outline` separately. The levels are **provisional** until checked in `stimuli.html`.

Excluded: strength 0 with density 0.1 and no outline. Disc and surround are then the same sparse
purple and the black gap is lost among the black dither cells, so the disc's edge cannot be seen.
Such trials swap their density/outline combination with another trial, so each combination still
appears 42 times per session, just never that one at strength 0.

Everything else is held fixed:

| Fixed | Value |
| ----- | ----- |
| `equiluminant` | true |
| `gap` | 0.02 |
| `size` | 0.5 |
| `dither_size` | 4 px |
| `size_panel` | fill |

`outline` is new: a solid ring of the disc's own colour just inside its edge, so the disc keeps a
defined edge at low density. It sits inside the radius, so it does not change the disc's size, and
the luminance covariates count it as solid colour. Rationale for each factor:
[`AGENTS.md`](../../AGENTS.md).

## Changes from pilot 1

| | Pilot 1 | Pilot 2 |
| - | ------- | ------- |
| `difference` | 0.025 to 0.5 (5 levels) | 0.01 to 0.5 (6 levels) |
| `illusion_strength` | -1 to 1 in 0.5 steps (5) | -1 to 1 in thirds (7) |
| `equiluminant` | false, true | true |
| `gap` | 0, 0.02, 0.06 | 0.02 |
| `size` | 0.25, 0.5, 0.75 | 0.5 |
| `dither_size` | 2, 4, 8 | 4 |
| `size_panel` | fill, "match" | fill |
| `density` | 0.5, 0.75, 1 | 0.1, 0.5, 1, crossed with `outline` (provisional) |
| `outline` | n/a | 0, 4 px, crossed with `density` (provisional) |
| Left/right larger | balanced within each strength level | also within each difference size |
| Excluded combinations | strength 0 with gap 0 | strength 0 with density 0.1 and no outline |
| Trials | 10 sets of 25 = 250 | 6 sets of 42 = 252 |
| Data file | `chromostereopsis_<start>_<id>.json` | `chromostereopsis_pilot2_<start>_<id>.json`, with `session.pilot = 2` |

## Data

As in pilot 1: one JSON per session with `session` (ids, times, device, canvas/screen size, and
`pilot`), `demographics`, `design` (the `DESIGN` used) and `trials` (response, RT, correctness, and
the full parameter dictionary, including `Seed`, `Outline` and the luminance covariates). The CSV
download is the same, flattened.

## Saving

Through [DataPipe](https://pipe.jspsych.org) to Zenodo, as
`[test_]chromostereopsis_pilot2_<start, UTC>_<participant_id>.json`; an abandoned session leaves a
`...partial.json`. Fetch with `python data/download.py --pilot 2` (on the machine where
`data/pilot2/raw` resolves; needs a Zenodo token, see the script's header).

The DataPipe client is vendored, not loaded from a CDN, so it cannot change during a study:
`datapipe-client@0.2.0`, sha256 `b2af030b77d8ccc6619582691dd94022b8d388230186b1a24cc736939774310c`
(same as pilot 1).

## Before collecting

- Settle the `density` and `outline` levels from `stimuli.html`.
- Set up a new DataPipe experiment and Zenodo deposit: `DATAPIPE_EXPERIMENT` in `experiment.js`
  (currently empty, so the end screen asks participants to download their file instead) and
  `DEPOSITS[2]` in `data/download.py`. Then add both ids to [Saving](#saving).
- Once pushed, add the live link
  (`https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/pilot2/`, `?test` for a
  test run) here and in the main README's Pilots table.
- Copy `analysis/pilot1/analysis.qmd` to `analysis/pilot2/` and adapt it: only `Density` and `Outline`
  (new) vary now, fully crossed, so test them and their interaction rather than pilot 1's six factors.

## Caveats

As in pilot 1: chromostereopsis likely depends on the display, viewing distance and lighting, none
of which are controlled online; they are recorded instead. The canvas fits the window, so retinal
size varies with viewing distance. `dither_size` and `outline` are in pixels, so their visual angle
varies too.
