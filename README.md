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

Add `?test` to a URL to try it without counting as data.

## Layout

```
experiment/pilotN/   the task (HTML/JS), frozen once run; its README covers design, data, saving
data/pilotN/manual/  sessions downloaded from the end screen
data/pilotN/raw/     sessions from Zenodo (git-ignored): python data/download.py --pilot N
analysis/pilotN/     analysis.qmd (R)
```

**New pilot:** tag the current commit, copy the previous `experiment/pilotN/`, give it a new
DataPipe experiment (`DATAPIPE_EXPERIMENT` in `experiment.js`, `DEPOSITS` in `data/download.py`),
then add `data/` and `analysis/` folders.
