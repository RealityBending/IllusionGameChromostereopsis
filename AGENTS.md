# IllusionGameChromostereopsis

## Aim

Chromostereopsis is the illusion that, on a **flat** image, saturated red appears nearer
than saturated blue on a black field (most observers; a minority see the reverse, and
10-20% see no depth at all). It is a *binocular* effect, driven mostly by longitudinal and
transverse chromatic aberration combined with the temporal offset of the fovea, plus a
plain brightness cue (red is emitted about 3x brighter than blue in sRGB).

The problem for an Illusion-Game-style task is that depth on a flat image has **no ground
truth**, so there is nothing to be right or wrong about. This study asks whether that can
be fixed by moving the judged attribute from depth to **size**:

> Does chromostereopsis bias size judgements, and if so, in which direction and under which
> stimulus conditions?

Two accounts predict **opposite** signs, which is what makes the question informative
rather than confirmatory:

- **Size constancy** — a disc that appears *nearer* at the same retinal size should appear
  *smaller*, so the red disc should be judged smaller.
- **Irradiation** — the *brighter* shape looks larger, so the red disc should be judged
  larger. (This is the sign the anecdotal pixel-art reports suggest.)

If neither holds, the design collapses back to a pure depth judgement with no ground truth
and the illusion cannot be used in the Illusion Game paradigm. So the honest framing of
this study is **viability screening**, not effect estimation.

## The three pieces

| Where | What |
| ----- | ---- |
| `Pyllusion/pyllusion/Chromostereopsis/` | The stimulus. `Chromostereopsis.py` holds the literature review, the mechanisms, the candidate design and the open questions; `chromostereopsis_parameters.py` computes the parameter dictionary; `chromostereopsis_image.py` renders it. Still a **prototype**, not in the public API. |
| `IllusionGame/chromostereopsis/` | The pilot experiment: dependency-free HTML/JS, `stimulus.js` being a port of the Pyllusion parameter and image functions (so a trial can be re-rendered from its recorded `Seed`). `design.js` holds `DESIGN` and builds the trial list. See its `README.md`. |
| this repo | The data (`data/pilots/`) and the analysis (`analysis/`). |

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
  disc on the left.** Levels: 0.1, 0.25, 0.5, 1.0, sign balanced. Never zero, so every trial
  has a correct answer — this is task difficulty.
- **`illusion_strength`** — how far apart each disc and its surround sit on the red-blue
  axis, from -1 to 1. At ±1 the discs are the pure colours; as the magnitude falls, discs
  *and* surrounds are all pulled toward the midpoint mix (a purple), until at 0 every region
  is that same purple and the two panels are chromatically identical — which gives each
  participant's own baseline left/right bias, exactly like Delboeuf's zero point. **The sign
  sets which panel gets the red-leaning disc** (>= 0 puts it on the left). Levels: -1, -0.5,
  0, 0.5, 1.

  Mixing is done in **linear light**, not in 8-bit code values, so the mixes behave like
  physical mixtures of the two lights. Two consequences: `equiluminant=True` stays exact at
  *every* strength, and a purple pixel is physically red light plus blue light, so its two
  retinal images are the red and blue images superimposed at reduced weight — the optical
  disparity signal is itself interpolated rather than switched off.

### The stimulus factors the pilot screens

These are the "which conditions, if any, make it work" factors, each taken from something
the literature reports as modulating chromostereopsis. They are **not** crossed with the
grid above (3x3x3x3x2x2 x the grid x repetitions is well over 20,000 trials). Instead each
is assigned within every set of 20 trials by **balanced randomisation**: every level appears
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

**Excluded combination**: `illusion_strength = 0` with `gap = 0` — same colour, no outline,
the disc is invisible. Offending trials are repaired by *swapping* a factor level with
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

`data/pilots/chromostereopsis_<participant_id>.json`, one file per session, as downloaded
from the end screen of the task. Each is a single container with `session`, `demographics`,
`design` (the `DESIGN` object the trials were built from) and `trials` — one entry per trial
carrying the response, the RT, and the **full Pyllusion parameter dictionary** for that
trial, including all the derived luminance and area quantities. The task also offers a
flat CSV download of the same thing; the JSON is what is kept here, since it is the lossless
version.

`analysis/analysis.qmd` reads every JSON in that folder and flattens them into one tidy
trial-level dataframe. R, tidyverse + easystats, as in the other Illusion Game repos.

## Status

The data currently in `data/pilots/` is **the author's own session**, run as a first check
that the task works end to end. It is not a sample. Treat any effect in it as a smoke test.
