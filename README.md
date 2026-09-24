# IllusionGameChromostereopsis

Can the chromostereopsis illusion (saturated red looking nearer than blue on a flat image) be
turned into an Illusion Game task, by having participants judge **size** rather than depth?
This repo holds the pilot experiment, its data and its analysis. The study is a **viability
screening**: it asks whether chromostereopsis biases size judgements at all, in which
direction, and under which stimulus conditions.

## Try the experiment

**<https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/>**

It runs in the browser, with the arrow keys (or by tapping the left or right half of the screen
on a touch device). Each session is saved to the project's
[Zenodo deposit](https://zenodo.org/uploads/22944626) through [DataPipe](https://pipe.jspsych.org),
trial by trial as it runs and as one file at the end, and can also be downloaded from the end screen.
To try it without your run counting as data, add `?test` to the URL
(<https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/?test>): the file is then
saved with a `test_` prefix. A run opened locally (`experiment/index.html`, no server needed) is
treated as a test too.

## Contents

| Folder | What |
| ------ | ---- |
| [`experiment/`](experiment/) | The pilot task: dependency-free HTML/JS, served by GitHub Pages at the link above. `stimulus.js` ports the Pyllusion parameter and image functions, and `design.js` holds `DESIGN` and builds the trial list. See [`experiment/README.md`](experiment/README.md) for the task, the design and the data format. |
| [`data/pilots/`](data/pilots/) | Sessions downloaded by hand from the task's end screen, one JSON file each. |
| [`data/download.py`](data/download.py) | Fetches the sessions DataPipe saved to Zenodo into `data/raw/`, which is git-ignored (participant data, public repo). Needs a Zenodo token while the deposit is a draft; see the script's header. `python data/download.py` |
| [`analysis/`](analysis/) | `analysis.qmd` reads every session file in `data/pilots/` and `data/raw/` (except test runs and partials) and flattens them into one trial-level dataframe (R, tidyverse + easystats). |

The stimulus itself is developed in
[Pyllusion](https://github.com/RealityBending/Pyllusion) (`pyllusion/Chromostereopsis/`), as a
prototype that is not yet in the public API.

[`AGENTS.md`](AGENTS.md) has the full rationale: the two competing predictions (size constancy vs
irradiation), each parameter, the brightness confound, and what is recorded but not controlled.

## Status

The data currently in `data/pilots/` is the author's own session, run as a first end-to-end check
of the task. It is not a sample.
