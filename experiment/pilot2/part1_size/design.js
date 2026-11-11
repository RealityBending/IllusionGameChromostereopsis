// Part 1, size task: the experimental design. Sets of trials that fully cross the two main
// parameters, with the remaining stimulus factors assigned by balanced randomisation. Also holds
// the helpers (shuffle, exclusions, ...) and the settings shared with part 2 (`fixed`, `exclude`,
// `fixation_duration`, `mask`), so it loads before part2_depth/design.js.
//
// The two parameters of interest are task difficulty (`difference`, the objective area difference
// between the discs) and `illusion_strength` (the chromatic separation between each disc and its
// surround). One *set* contains their full grid once: with 6 difficulty levels and 7 strength levels
// that is 42 trials, so the session length is a multiple of 42 (`n_sets`). The sign of the
// difference (which side is larger) is balanced as described at signPlan().
//
// The other stimulus factors are what the pilot is exploring. They are not crossed with the grid
// (that would need thousands of trials) but assigned within each set by *balanced randomisation*:
// every level appears equally often (up to rounding) and the orders are shuffled independently, so
// the factors are orthogonal to the grid and to each other in expectation. Pooled across
// participants, a (mixed) regression can then estimate their main effects and interactions.

const DESIGN = {
    n_sets: 6, // number of full difficulty x strength grids; 1 = 42 trials, 6 = 252. Keep it even, so
    // every sign pattern is paired with its mirror image (see signPlan)
    n_blocks: 4, // trials are split evenly across blocks, with a break screen in between

    // Task difficulty: magnitude of the objective area difference between the two discs (as in
    // Pyllusion's Delboeuf: 0.1 = the larger disc has 10% more area, 1 = twice the area, i.e. 1.41x
    // the diameter). Never zero, so every trial has a correct answer. The sign is balanced separately.
    // Pilot 2 adds 0.01 below pilot 1's levels.
    difference: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5],

    // Illusion strength: +/-1 = pure colours, sign = which panel gets the red-leaning disc; 0 = both
    // panels the same purple (each participant's baseline left/right bias). Pilot 2 uses thirds
    // (rounded, so the logged values stay tidy), to see whether the bias grows with the separation.
    illusion_strength: [-1, -0.67, -0.33, 0, 0.33, 0.67, 1],

    // Remaining stimulus factors, each with the levels to be balanced within a set. A level can also
    // be an object, which sets several options at once: that is how two factors are crossed rather
    // than balanced separately. Pilot 2 fixes all of pilot 1's factors but density, and crosses it
    // with `outline`, a solid coloured outline in the disc's own colour at its edge (in pixels, 0 = none). Of the
    // 6 combinations (`density_outline_all`), density 0.1 without the coloured outline is excluded (see `exclude`),
    // leaving 5, balanced within each set of 42 (8 or 9 each). At density 1 the coloured outline is invisible, so
    // those two are identical images (a built-in check).
    density_outline_all: [0.1, 0.5, 1].flatMap((density) => [0, 4].map((outline) => ({ density, outline }))),
    factors: {
        density_outline: null, // set below: density_outline_all minus the excluded combinations
    },

    // Combinations that make no sense as a trial. Each rule is a predicate on the trial's options that
    // returns true when the trial must be excluded. Offending trials are repaired by swapping factor
    // levels with another trial, so the marginal balance of every factor is preserved.
    // A rule that does not depend on the trial's grid cell (strength, difference) removes the
    // combination from the factor's levels altogether (see below).
    exclude: [
        // Density 0.1 without the coloured outline: 9 in 10 dither cells are black, so the gap is lost and the
        // disc's edge is only where the dot colour changes, too ill-defined to judge size by (and
        // invisible at strength 0, where disc and surround are the same purple)
        (o) => o.density === 0.1 && o.outline === 0,
    ],

    // Held constant
    fixed: {
        color1: "red",
        color2: "blue",
        background: "black",
        distance: 1,
        luminance1: 1,
        luminance2: 1,
        dither_shared: true,
        equiluminant: true,
        gap: 0.02,
        size: 0.5, // disc diameter (proportion of canvas height)
        dither_size: 4, // pixels
        size_panel: null, // surround fills its half
    },

    fixation_duration: [600, 1100], // ms, uniform jitter

    // Mask shown after each response to cut the colour afterimage of the saturated stimulus:
    // achromatic dynamic noise (a new random grey pattern every `refresh` ms) over each panel.
    // Greys are kept dark (0 to `max_grey` out of 255) so the mask adds little light to the display.
    mask: { duration: 500, refresh: 50, cell: 4, max_grey: 140 },
}

// Derived
DESIGN.factors.density_outline = DESIGN.density_outline_all.filter((combo) => !isExcluded(DESIGN, combo))
DESIGN.n_per_set = DESIGN.difference.length * DESIGN.illusion_strength.length
DESIGN.n_total = DESIGN.n_sets * DESIGN.n_per_set

// --- Helpers -----------------------------------------------------------------------------------
function shuffle(array) {
    const a = array.slice()
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// n values in which each level appears floor(n/k) or ceil(n/k) times, in random order
function balancedLevels(levels, n) {
    const out = []
    const cycle = shuffle(levels)
    for (let i = 0; i < n; i++) out.push(cycle[i % cycle.length])
    return shuffle(out)
}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// --- Signs of the difference (which side is larger), balanced three ways -------------------------
// Pilot 1 balanced the sign only within each strength level of a set, so a given magnitude could end
// up mostly on one side. Here the sign is balanced,
// as far as the counts allow:
//   - within each strength level of each set (as in pilot 1),
//   - within each magnitude x strength cell across sets,
//   - within each magnitude across the whole session.
// Each strength level gets a sign pattern over the magnitudes; sets alternate between that pattern
// and its mirror image (the pattern in the extra set, when n_sets is odd). The patterns are redrawn
// until each magnitude's net sign across strength levels is at most 1.
function signPlan(design) {
    const nMagnitudes = design.difference.length
    let patterns = null
    let bestWorst = Infinity
    for (let attempt = 0; attempt < 10000 && bestWorst > 1; attempt++) {
        const candidate = design.illusion_strength.map(() => balancedLevels([-1, 1], nMagnitudes))
        const net = [...Array(nMagnitudes).keys()].map((m) => candidate.reduce((sum, row) => sum + row[m], 0))
        const worst = Math.max(...net.map(Math.abs))
        if (worst < bestWorst) {
            patterns = candidate
            bestWorst = worst
        }
    }
    const mirrored = shuffle([...Array(design.n_sets).keys()].map((i) => i % 2 === 1))
    return (set, strengthIndex, magnitudeIndex) =>
        patterns[strengthIndex][magnitudeIndex] * (mirrored[set - 1] ? -1 : 1)
}

// --- One set: the full difficulty x strength grid ------------------------------------------------
function makeSet(design, set, signOf) {
    const cells = []
    design.illusion_strength.forEach((strength, k) => {
        design.difference.forEach((magnitude, m) => {
            cells.push({
                illusion_strength: strength,
                difference: signOf(set, k, m) * magnitude,
            })
        })
    })
    return shuffle(cells)
}

// A factor level is either a value (sets the option of that name) or an object (sets several options)
function applyLevel(options, name, level) {
    if (level !== null && typeof level === "object") Object.assign(options, level)
    else options[name] = level
}

// --- Exclusions --------------------------------------------------------------------------------
// Options of trial i as they stand (grid cell + current factor columns), for checking the rules
function trialOptions(cells, columns, i) {
    const options = Object.assign({}, cells[i])
    for (const name of Object.keys(columns)) applyLevel(options, name, columns[name][i])
    return options
}

function isExcluded(design, options) {
    return (design.exclude || []).some((rule) => rule(options))
}

// Make every trial pass the exclusion rules by swapping one factor level between an offending trial
// and another trial, such that both end up valid. Swapping (rather than redrawing) keeps every
// factor's marginal counts exactly as balanced as before.
function repairExclusions(design, cells, columns) {
    const names = Object.keys(columns)
    for (let i = 0; i < cells.length; i++) {
        if (!isExcluded(design, trialOptions(cells, columns, i))) continue
        let repaired = false
        for (const name of shuffle(names)) {
            for (const j of shuffle([...cells.keys()])) {
                if (j === i || columns[name][j] === columns[name][i]) continue
                ;[columns[name][i], columns[name][j]] = [
                    columns[name][j],
                    columns[name][i],
                ]
                if (
                    !isExcluded(design, trialOptions(cells, columns, i)) &&
                    !isExcluded(design, trialOptions(cells, columns, j))
                ) {
                    repaired = true
                    break
                }
                ;[columns[name][i], columns[name][j]] = [
                    columns[name][j],
                    columns[name][i],
                ] // undo
            }
            if (repaired) break
        }
        if (!repaired) {
            throw new Error(
                "Could not build a trial list that satisfies the exclusion rules; relax them or add levels.",
            )
        }
    }
}

// --- Trial list --------------------------------------------------------------------------------
// Returns an array of {set, block, trial, trial_in_block, options}, where `options` is the argument
// for Chromostereopsis.parameters(). `width`/`height` are the canvas size the stimulus is drawn at.
function makeTrials(design, width, height) {
    const trials = []
    const signOf = signPlan(design)
    for (let set = 1; set <= design.n_sets; set++) {
        const cells = makeSet(design, set, signOf)
        const columns = {}
        for (const [name, levels] of Object.entries(design.factors)) {
            columns[name] = balancedLevels(levels, cells.length)
        }
        repairExclusions(design, cells, columns)
        cells.forEach((cell, i) => {
            const options = Object.assign({}, design.fixed, cell, {
                width: width,
                height: height,
            })
            for (const name of Object.keys(columns))
                applyLevel(options, name, columns[name][i])
            options.seed = randomInteger(0, 2 ** 31 - 1)
            // Fail before the session starts rather than in the middle of a block if a combination
            // of levels cannot be rendered (e.g. a disc that does not fit its panel)
            Chromostereopsis.parameters(options)
            trials.push({ set: set, options: options })
        })
    }
    const perBlock = Math.ceil(trials.length / design.n_blocks)
    trials.forEach((trial, i) => {
        trial.trial = i + 1
        trial.block = Math.floor(i / perBlock) + 1
        trial.trial_in_block = (i % perBlock) + 1
    })
    return trials
}

