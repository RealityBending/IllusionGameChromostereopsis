# IllusionGameChromostereopsis

## Aim

Chromostereopsis is the perception of depth between colours on a flat image. With saturated red
and blue on black, most observers report red as nearer; a minority report the reverse, and roughly
10-20% no depth. It is thought to be mainly binocular, driven by chromatic aberration and the
offset of the fovea from the optical axis, with brightness as an extra cue (red is about 3x
brighter than blue in sRGB).

Depth on a flat image has no ground truth, but size does, so this study measures size judgements:

> **Primary:** does the perceived depth from chromostereopsis carry over into size judgements and,
> if so, in which direction?
>
> **Secondary:** develop an online method for measuring the effect of chromostereopsis on size
> judgements.

Two accounts predict **opposite** directions:

- **Size constancy**: a disc that appears *nearer* at the same retinal size should appear
  *smaller*, so the red disc should be judged smaller.
- **Irradiation**: the *brighter* shape looks larger, so the red disc should be judged larger.

The study is screening, not effect estimation, and does not assess Illusion Game suitability (see
**Limitation: optics vs perception**).

## The three pieces

| Where | What |
| ----- | ---- |
| `Pyllusion/pyllusion/Chromostereopsis/` | The stimulus. `Chromostereopsis.py` holds the literature review, the mechanisms, the candidate design and the open questions; `chromostereopsis_parameters.py` computes the parameter dictionary; `chromostereopsis_image.py` renders it. Still a **prototype**, not in the public API. |
| `experiment/pilotN/` (this repo) | One pilot's experiment: dependency-free HTML/JS, `stimulus.js` being a port of the Pyllusion parameter and image functions (so a trial can be re-rendered from its recorded `Seed`). `design.js` holds `DESIGN` and builds the trial list. See its `README.md`. Served by GitHub Pages at `https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/pilotN/`, so anything pushed to `main` is live; `experiment/index.html` is only a landing page linking to the pilots. |
| this repo | The data (`data/pilotN/`) and the analysis (`analysis/pilotN/`). |

### One folder per pilot

`experiment/pilotN/`, `data/pilotN/{manual,raw}/`, `analysis/pilotN/`.

- Each pilot's task is a full copy, not shared code: a trial only re-renders from its `Seed` with
  the code that drew it. **Never edit a finished pilot's code** (pilot 1 = git tag `pilot1`).
- Each pilot has its own DataPipe experiment and Zenodo deposit (`DATAPIPE_EXPERIMENT`,
  `DEPOSITS` in `data/download.py`).

## The task

Two square panels side by side, each a dithered coloured disc on a dithered surround of the
*other* colour, separated by a bare black annulus. The two panels are geometrically
identical and use the same two colours with the roles swapped — one red disc on blue, one
blue disc on red — so they differ *only* in which colour is figure and which is ground.

The participant reports **which disc is larger**, with the arrow keys, as fast as possible.
The illusion is measured **objectively only**: no subjective depth report is collected at
any stage. It shows up as an asymmetry of error rates (and RTs) between the two signs of
`illusion_strength`, i.e. between the red disc being on the left and on the right.

## The parameters

### The two of interest, fully crossed

- **`difference`** — the objective area difference between the two discs, and the attribute
  being judged. Defined exactly as in Pyllusion's Delboeuf and Ebbinghaus, so the same value
  means the same thing across all three: the smaller disc stays at `size` and the larger is
  scaled by `sqrt(1 + |difference|)`. So it is a difference in *area*, not diameter
  (`difference = 1` is twice the area, i.e. 1.41x the diameter). **Positive puts the larger
  disc on the left.** Levels: 0.025, 0.05, 0.1, 0.25, 0.5 in pilot 1, plus 0.01 in pilot 2, sign balanced. Never zero, so every trial
  has a correct answer — this is task difficulty.
- **`illusion_strength`** — how far apart each disc and its surround sit on the red-blue
  axis, from -1 to 1. At ±1 the discs are the pure colours; as the magnitude falls, discs
  *and* surrounds are all pulled toward the midpoint mix (a purple), until at 0 every region
  is that same purple and the two panels are chromatically identical — which gives each
  participant's own baseline left/right bias, exactly like Delboeuf's zero point. **The sign
  sets which panel gets the red-leaning disc** (>= 0 puts it on the left). Levels: -1, -0.5,
  0, 0.5, 1 in pilot 1; thirds (-1, -0.67, -0.33, 0, 0.33, 0.67, 1) in pilot 2.

  Mixing is done in **linear light**, not in 8-bit code values, so the mixes behave like
  physical mixtures of the two lights. Two consequences: `equiluminant=True` stays exact at
  *every* strength, and a purple pixel is physically red light plus blue light, so its two
  retinal images are the red and blue images superimposed at reduced weight — the optical
  disparity signal is itself interpolated rather than switched off.

### The stimulus factors screened

The table below is **pilot 1's** design, which screened all six factors. Pilot 2 fixes all of them
but `density`, and crosses that with a new `outline` (below). Each pilot's levels:
`experiment/pilotN/README.md`, compared side by side in `README.md`.

These are the "which conditions, if any, make it work" factors, each taken from something
the literature reports as modulating chromostereopsis. They are **not** crossed with the
grid above (3x3x3x3x2x2 x the grid x repetitions is well over 20,000 trials). Instead each
is assigned within every set of 25 trials by **balanced randomisation**: every level appears
equally often up to rounding, orders shuffled independently, so the factors are orthogonal
to the grid and to each other in expectation. Continuous factors get three levels so that a
monotonic effect can be distinguished from a non-monotonic one.

| Factor | Levels | What it targets |
| ------ | ------ | --------------- |
| `size` | 0.25, 0.5, 0.75 | Disc diameter, in Pyllusion grid units (sizes scale with the image height, `2` spanning it fully — so `0.25` is a 75 px disc on the default 800x600). Larger, centrally viewed patches are reported stronger; 0.25 is only the Delboeuf-matching default. |
| `size_panel` | `null` (fill), `"match"` | How much surround there is. `null` = each panel fills its half, so the surround acts as the stimulus background and the two panels touch at the midline; `"match"` = the side at which disc and surround areas are equal (~1.36x the disc diameter), the only setting that removes the panel brightness imbalance *geometrically*. Logged as `Size_Panel_Mode`. |
| `gap` | 0, 0.02, 0.06 | Width of the bare black annulus between disc and surround. A thin contrasting border is reported to be able to *flip* perceived depth order; `gap = 0` gives a bare red-blue edge at the disc. |
| `density` | 0.5, 0.75, 1 | Proportion of dither cells that are coloured. 1 is a solid fill, i.e. the control for the pixel-art claim. Also a second, independent luminance knob: it scales a region's mean luminance without touching its pixel colours. |
| `dither_size` | 2, 4, 8 | Dither cell side, **in pixels**. Chunky dither is anecdotally reported to strengthen the effect. Because it is a pixel quantity it does not scale with the image or the panel — `Dither_Cells_Across` is the scale-invariant number to hold constant when comparing across panel sizes. |
| `equiluminant` | `false`, `true` | Scale the brighter colour down to the luminance of the dimmer one. Expected to *weaken* the depth, but it is the only way to attribute a size bias to colour rather than to brightness, so both levels are kept throughout. |

**Held fixed**: `color1="red"`, `color2="blue"`, `background="black"` (black maximises positive
chromostereopsis; note that on black every colour has a Michelson contrast of 1, so
`background` must move for contrast to be manipulable at all), `distance=1`, `luminance1=1`,
`luminance2=1`, `dither_shared=true` (both panels get the same dither pattern, so colour
assignment is the only difference between them). One random `seed` per trial, logged.

**`outline`** (pilot 2, not in Pyllusion): a solid ring of the disc's own colour just inside its
edge, in pixels (0 = none). It keeps the disc's edge, and so its size, defined when the disc is
sparsely dithered. It is invisible on a solid disc, so it only matters below `density = 1`; pilot 2
fully crosses the two (0 and 4 px x density 0.1, 0.5, 1).

**Excluded combination**: `illusion_strength = 0` with `gap = 0` in pilot 1, and with
`density = 0.1` and `outline = 0` in pilot 2 — same colour and no visible edge, so the disc is
invisible. Offending trials are repaired by *swapping* a factor level with
another trial, which preserves every factor's marginal balance.

### The brightness confound, which is the thing to watch

Red is ~3x more luminous than blue in sRGB, and disc and surround have different areas, so
the panel with the red *surround* is brighter overall. At the default filling panel size
this is about a **2.7x** imbalance between the two panels. Since brightness is itself a depth
and probably a size cue, it confounds exactly the comparison of interest. `equiluminant=True`
removes it exactly at any panel size; `size_panel="match"` removes it geometrically, but only
at `difference = 0`, so a small residual remains that scales with `difference`.

The parameter dictionary reports this analytically per trial — keep
**`Luminance_Panel_Ratio`** and **`Luminance_Ratio_Inner`** as covariates. The point of the
pilot is to find cells where *colour* does more than brightness alone.

### Recorded, not controlled

Chromostereopsis depends on the observer's optics, the display and the viewing conditions,
none of which an online study can set. Demographics therefore record glasses and correction,
self-reported colour and depth vision, device, viewing distance and room lighting. Note the
literature's recommendation is a dark *stimulus* in a well-lit *room* (in dim light the pupil
dilates eccentrically and the direction of the effect decorrelates from the predicted
disparity), which cuts against the folk advice that a darker room is stronger.

Viewing distance also changes the *retinal* size of the stimulus, because the canvas is
fitted to the viewport (4:3, at most 90% of the window) rather than to a fixed visual angle.

## Data

One JSON file per session, a single container with `session`, `demographics`, `design` (the
`DESIGN` object the trials were built from) and `trials` — one entry per trial carrying the
response, the RT, and the **full Pyllusion parameter dictionary** for that trial, including all
the derived luminance and area quantities. The task also offers a flat CSV download of the same
thing; the JSON is what is kept, since it is the lossless version.

Sessions reach this repo two ways:

- **Zenodo, through DataPipe** (the normal route; pilot 1: experiment `Xykm83c1D95D`, deposit
  `zenodo.org/uploads/22944626`). The task streams one record per trial
  into a DataPipe session and sends the whole container at the end, as
  `[test_]chromostereopsis_<start, UTC>_<participant_id>.json`; someone who stops partway
  leaves a `<name>-<id>.partial.json` (a bare array of `frame` and `trial` records) instead.
  `data/download.py --pilot N` (adapted from TestYourself's, standard library only) pulls that
  pilot's deposit into `data/pilotN/raw/`, which is **git-ignored** (`data/*/raw/`): this repo is
  public and served by GitHub Pages, so participant data must never be committed. Details in
  `experiment/pilotN/README.md` > Saving. The client is vendored at
  `experiment/pilotN/vendor/datapipe-client.js` (0.2.0, hash in that README); do not swap it for a
  CDN tag.
- **By hand**: files downloaded from the end screen go in `data/pilotN/manual/` (only pilot 1 has one so far).

`analysis/pilotN/analysis.qmd` reads every JSON in that pilot's two folders — skipping `test_` runs
and `.partial.json` files — and flattens them into one tidy trial-level dataframe. R, tidyverse +
easystats, as in the other Illusion Game repos.

## Limitation: optics vs perception

Chromostereopsis appears to depend largely on each observer's optics (chromatic aberration, pupil
position), which vary in strength and direction between people. Any effect on size judgements may
therefore combine an optical stage (the depth signal) and a perceptual stage (depth feeding into
size).

**This study can** measure the combined effect online, its direction, and whether it scales with
`illusion_strength`, and estimate each observer's direction so that opposite effects are not
averaged out.

**This study cannot** measure the eye's optics, separate the optical stage from the perceptual one,
or measure the perceptual stage on its own. These would likely need a lab study with optical
measures (e.g. vernier alignment for chromatic aberration).

## Status

- **Pilot 1** is finished: 15 participants, written up in `analysis/pilot1/pilot_analysis.pdf`.
- **Pilot 2** is in design: changes listed in `experiment/pilot2/README.md`; check stimuli with
  `experiment/pilot2/stimuli.html`. No DataPipe experiment yet (`DATAPIPE_EXPERIMENT = ""`).
