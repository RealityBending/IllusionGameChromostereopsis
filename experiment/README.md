# Chromostereopsis pilot

A minimal online paradigm, in plain HTML and JavaScript with no dependencies, to pilot the
chromostereopsis stimulus developed in
[Pyllusion](https://github.com/RealityBending/Pyllusion) (`pyllusion/Chromostereopsis/`).

Live at <https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/> (GitHub Pages,
so whatever is on `main` is what participants get), or open `index.html` in a browser (no server
needed; such a run is saved as a test, see **Saving**). Responses are given with the arrow keys or,
on a touch screen, by tapping the left or right half of the screen (any tap continues from a break).

## The task

Two coloured discs, one per panel, each on a surround of the other colour. The participant reports
**which disc is larger** with the arrow keys, as fast as possible. The illusion is measured
objectively only: a chromostereoptic depth effect should bias size judgements, which shows up as an
asymmetry of error rates (and reaction times) between the two signs of `illusion_strength`, i.e.
between the red disc being on the left or on the right. No subjective depth report is collected.

Flow: consent (placeholder text; its button requests full screen) > demographics > instructions,
with two worked examples and the correct key animated > trials in blocks, with a per-block progress
bar and a break screen between blocks > end screen, which saves the data to Zenodo (see **Saving**)
and says whether that worked, and also offers it as JSON / CSV downloads (printed in a text box
too, and available as `window.CHROMOSTEREOPSIS_DATA`).

## Files

- `stimulus.js`: port of Pyllusion's `_chromostereopsis_parameters()` and `_chromostereopsis_image()`.
  `Chromostereopsis.parameters(options)` returns the same parameter dictionary as Pyllusion (colours,
  luminances, contrasts, areas, predicted panel luminance, dither settings), and
  `Chromostereopsis.draw(canvas, params)` renders it. Colours are mixed in linear light, so
  `equiluminant` holds at every strength. A trial can be re-rendered from its recorded `Seed`.
- `design.js`: `DESIGN` (total trials, blocks, difference levels, factors and their levels, fixed
  parameters) and `makeTrials()`, which builds the trial list.
- `experiment.js`: screens, timing, data, saving.
- `index.html`: the page, including the demographics form and the instruction text.
- `vendor/datapipe-client.js`: DataPipe's client, the one file here that is not ours (see **Saving**).

## Design

The two parameters of interest are **task difficulty** (`difference`, the objective area difference
between the discs, positive = left larger, 4 magnitudes from 10% more area to double the area) and
**illusion strength** (5 levels: -1, -0.5, 0, 0.5, 1). One **set** of trials contains their full
grid once, i.e. 4 x 5 = 20 trials, with the sign of the difference balanced within each strength
level. The session length is a multiple of 20 (`DESIGN.n_sets`: 1 set = 20 trials, 2 = 40, ...),
split evenly across `DESIGN.n_blocks` blocks (default 4) with a break screen between blocks.

The remaining stimulus factors are what the pilot explores. They are not crossed with the grid, which
would need thousands of trials, but assigned within each set by **balanced randomisation**: every
level appears equally often (up to rounding) and the orders are shuffled independently, so the
factors are orthogonal to the grid and to each other in expectation. Pooled across participants,
the design supports a mixed regression of accuracy (or reaction time) on the factors and their
interactions, which disentangles their unique contributions. Continuous factors have three levels so
that a monotonic effect can be told from a non-monotonic one:

| Factor         | Levels          | Why                                                          |
| -------------- | --------------- | ------------------------------------------------------------ |
| `size`         | 0.25, 0.5, 0.75 | Larger, centrally viewed patches are reported stronger.       |
| `gap`          | 0, 0.02, 0.06   | Thin contrasting outline vs bare red/blue edge.               |
| `density`      | 0.5, 0.75, 1    | Dither vs solid fill (control for the pixel-art claim).       |
| `equiluminant` | false, true     | Separates the chromatic cue from the brightness cue.          |
| `dither_size`  | 2, 4, 8         | Fine vs chunky dither (pixels).                               |
| `size_panel`   | null, "match"   | Surround fills its half vs area-matched surround.             |

Strength 0 puts the same purple on both panels, so it gives each participant's baseline left/right
bias; the half levels test whether the bias grows with the chromatic separation. One combination is
excluded: strength 0 with `gap` 0, where the disc is the same colour as its surround with no outline
and so cannot be seen. `DESIGN.exclude` holds such rules; offending trials are repaired by swapping a
factor level with another trial, which keeps every factor's marginal counts balanced. With one set the
three-level factors get 7/7/6 trials, so per-participant estimates of those are rough: the design
relies on pooling across participants, or on more sets.

To change the design, edit `DESIGN` in `design.js`: any option of `Chromostereopsis.parameters` can
be added as a factor or fixed, and the difficulty and strength level sets can be changed (the set
size follows).

After each response the stimulus is replaced for 500 ms by an achromatic dynamic-noise mask (a new
random dark-grey pattern every 50 ms over the stimulus area), to break the colour afterimage of the
saturated stimulus before the next fixation. Its settings are in `DESIGN.mask` and the duration
actually shown is logged per trial as `mask_duration`.

## Data

The session is logged as one JSON container:

```
{
  "session":      { participant_id (random 8-character string), test (see Saving), start_time / consent_time /
                    end_time (ISO, UTC), date and time (local) and timezone, touch_device, canvas
                    and window size, screen size, device pixel ratio, full-screen state, user agent },
  "demographics": { sex, age, glasses, correction_type, correction_now, colour_vision,
                    depth_vision, device, viewing_distance, lighting },
  "design":       { the DESIGN object the trials were built from },
  "trials": [
    { "order": 1, "set": 1, "block": 1, "trial_in_block": 1,
      "isi": 812,                      // fixation duration before the stimulus, ms
      "render_time": 18.4,             // ms spent drawing the stimulus, inside the ISI
      "stimulus_onset": 123456,        // performance.now() at the first painted frame
      "response": "ArrowLeft", "response_modality": "keyboard",   // or touch/mouse/pen
      "response_x": null, "response_y": null,  // tap position for touch/mouse responses
      "correct_response": "ArrowRight", "correct": false,
      "rt": 634.2,                     // ms from stimulus onset to key press
      "parameters": { every entry of the Pyllusion parameter dictionary: Difference,
                      Illusion_Strength, Size, Gap, Density, Equiluminant, Dither_Size,
                      Size_Panel_Mode, the colours of each region, Luminance_Ratio_Inner,
                      Luminance_Panel_Ratio, Seed, ... } },
    ...
  ]
}
```

The JSON download is this container as is. The CSV download is its flat version: one row per
trial, with the session and demographic fields repeated on every row and the parameters spread into
columns (RGB triplets written as `r,g,b`).

Suggested first model: `correct ~ difference_signed * illusion_strength * (size + gap + density +
equiluminant + dither_size + size_panel) + (1 | participant)`, logistic. The illusion is the
`difference x illusion_strength` interaction: with the red disc on the left, an irradiation-type
bias makes "left larger" errors more likely when the right disc is objectively larger, while a
constancy-type bias does the opposite.

## Saving

Sessions are saved to this project's Zenodo deposit (<https://zenodo.org/uploads/22944626>)
through [DataPipe](https://pipe.jspsych.org) (experiment `Xykm83c1D95D`, `DATAPIPE_EXPERIMENT` in
`experiment.js`), following what TestYourself does. The session goes there twice, in two ways:

- **As it runs**, into a DataPipe session opened when the trials start: one `"record": "frame"`
  (`session`, `demographics`, `design`), then one `"record": "trial"` per trial (the trial object
  above). If the participant leaves before the end, DataPipe files what it holds about 15 minutes
  later as `<name>-<id>.partial.json`, a bare JSON array of those records, so an abandoned session
  still leaves its trials.
- **At the end**, the whole container, exactly as the JSON download, sent with the session. The
  session is then closed as submitted, which tells DataPipe to drop the staged records rather than
  file them as a partial next to the complete file.

The file is named `chromostereopsis_<start time, UTC>_<participant_id>.json`; the start time keeps
it unique (DataPipe refuses a name it already has) and sorts the deposit chronologically. The
downloads use the same name. A **test run** (`?test` in the URL, or the page opened from disk or
`localhost`) is saved like any other but prefixed `test_`, with `"test": true` in `session`.

The staging is best-effort: if the client is missing or the session cannot start, the trials run
as usual and only the final file is sent. The end screen says "saved" or asks the participant to
download the file and send it on. "Saved" means DataPipe accepted the file; it can take a while to
appear on Zenodo.

While collecting, the deposit is an unpublished **draft**, readable only by its owner. Do not
publish it during collection (DataPipe writes into the draft); when collection is over,
**finalise** the experiment on DataPipe first, and only then publish the Zenodo record.

**The client** is DataPipe's `datapipe-client@0.2.0`, kept in `vendor/` rather than loaded from
unpkg, so the code participants run cannot change under a running study. It is the same file
TestYourself vendors, from
`https://unpkg.com/datapipe-client@0.2.0/dist/datapipe-client.browser.global.js`, sha256
`b2af030b77d8ccc6619582691dd94022b8d388230186b1a24cc736939774310c`. To update, download the new
version by hand and write its version and hash here. It adds DataPipe's limits: 16 KiB per record
(a trial is about 1.7 KB), 1,000 records per session (the design has 200 trials) and 24 hours per
session.

**Getting the data back**: `python data/download.py` (from the repository root) fetches the
deposit into `data/raw/` (git-ignored), checks each file's checksum, and counts complete sessions,
partials and test runs. It needs a Zenodo token (`ZENODO_TOKEN`, or `~/.zenodo_token`) because the
deposit is a draft; see the script's header.

## Caveats

Chromostereopsis is binocular and depends on the display, viewing distance and room lighting, none
of which an online study controls. Those are recorded, not set. Viewing distance also changes the
retinal size of the stimulus, since the canvas is fitted to the viewport (4:3, at most 90% of the
window) rather than to a fixed visual angle.
