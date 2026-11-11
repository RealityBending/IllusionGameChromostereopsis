# IllusionGameChromostereopsis

Chromostereopsis is the perception of depth between colours on a flat surface. For example, with
red and blue on black, most observers report red as nearer, although some report the reverse and
some no depth.

**Primary aim:** does the perceived depth from chromostereopsis carry over into **size** judgements
and, if so, in which direction?

**Secondary aim:** develop an online method for measuring the effect of chromostereopsis on size
judgements.

**Limitation:** chromostereopsis depends partly on each observer's eye optics, so any effect on size
judgements likely combines optics and perception. This study cannot separate the two; that would
likely need a lab study. Details and design rationale: [`AGENTS.md`](AGENTS.md#limitation-optics-vs-perception).

## Pilots

| Pilot | Task | Status |
| ----- | ---- | ------ |
| 1 | [experiment/pilot1/](https://realitybendinglab.com/IllusionGameChromostereopsis/experiment/pilot1/) | Done, n = 15. [Write-up](analysis/pilot1/pilot_analysis.pdf). Frozen (git tag `pilot1`). |
| 2 | [experiment/pilot2/](experiment/pilot2/) | In design, not yet online. [Changes from pilot 1](experiment/pilot2/README.md). |

Add `?test` to a URL to try it without counting as data.

### Design by pilot

| | Pilot 1 | Pilot 2 |
| - | ------- | ------- |
| `difference` | 0.025 to 0.5 (5 levels) | 0.01 to 0.5 (6 levels) |
| `illusion_strength` | -1 to 1 in 0.5 steps (5) | -1 to 1 in thirds (7) |
| `equiluminant` | false, true | true |
| `gap` | 0, 0.02, 0.06 | 0.02 |
| `size` | 0.25, 0.5, 0.75 | 0.5 (depth task: 0.5, 0.75, 1) |
| `dither_size` | 2, 4, 8 | 4 |
| `size_panel` | fill, "match" | fill |
| `density` | 0.5, 0.75, 1 | 0.1, 0.5, 1, crossed with `outline`, 0.1 only with it (provisional) |
| `outline` | n/a | 0, 4 px, crossed with `density` (provisional) |
| Left/right larger | balanced within each strength level | also within each difference size |
| Trials | 10 sets of 25 = 250 | 6 sets of 42 = 252 |
| Depth task | none | 48 trials after the size task, one disc at a time: "circle or surrounding area nearer?" |

What each parameter does: [`AGENTS.md`](AGENTS.md#the-parameters). More on each pilot's changes:
its `experiment/pilotN/README.md`.

## Layout

```
experiment/pilotN/   the task (HTML/JS), frozen once run; its README covers design, data, saving
                     (pilot 2: one subfolder and README per part, part1_size/ and part2_depth/)
data/pilotN/manual/  sessions downloaded from the end screen, if any
data/pilotN/raw/     sessions from Zenodo (git-ignored): python data/download.py --pilot N
analysis/pilotN/     analysis.qmd (R)
```

**New pilot:** tag the current commit, copy the previous `experiment/pilotN/`, give it a new
DataPipe experiment (`DATAPIPE_EXPERIMENT` in `experiment.js`, `DEPOSITS` in `data/download.py`),
then add `data/` and `analysis/` folders.
