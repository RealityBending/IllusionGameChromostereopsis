// Task 2, depth task: the experimental design. Loads after task1_size/design.js, whose helpers
// (shuffle, applyLevel, isExcluded, randomInteger) and shared settings (DESIGN.fixed,
// DESIGN.exclude, DESIGN.fixation_duration, DESIGN.mask) it uses.
//
// One panel at a time (the left panel of the usual stimulus, centred; see experiment.js): "which
// looks nearer, the circle or the surrounding area?", answered circle, surround or no difference. A
// depth report has no correct answer, so it does not replace the size task. It classifies each
// participant as red nearer, blue nearer or no depth (a grouping for the size analysis, and a count
// of interest in itself). Run after the size task so that the size judgements are made before
// participants know the study is about depth. Notes: AGENTS.md > Measuring perceived depth.
//
// Kept short and simple: full-strength red and blue discs only, solid (density 1, no dither), no
// outline, task 1's gap. As only the left panel is shown, the sign of
// the strength is the disc's colour (positive = red disc on blue). Dither is not varied here: in the
// main experiment, task 2 can use whichever dither gives the strongest effect in task 1.
//
// Disc size varies (0.5, as task 1, and 1) so that a colour can come up twice in a row without
// repeating the same image: with one size, the no-repeat rule below would force red and blue to
// alternate, a pattern participants could answer by. Too few trials per size to compare sizes.
//
// 2 sizes x (6 red + 6 blue) = 24 trials to classify each participant's depth direction (48 before,
// with purple trials: too long, about 8 minutes). Figures tend to look in front of their ground, but
// the red vs blue comparison cancels that. No time limit: the stimulus stays until the response (RT
// is still recorded).

const DEPTH_DESIGN = {
    n_reps: 6, // per strength level and size; or an object giving it per strength level
    illusion_strength: [-1, 1], // no 0: see above
    factors: { size: [0.5, 1] }, // fully crossed with strength; varied, not planned as a test
    // Overrides DESIGN.fixed. Solid discs: dither is tested in task 1, and the main experiment's
    // task 2 can use whichever dither works best there. (Disc sizes: equal disc and surround areas
    // at about 1.06.)
    fixed: { density: 1, outline: 0 },
    difference: 0, // discs the same size (it would only matter for the hidden panel anyway)

    // Trial order (see orderDepthTrials):
    // - never the same trial twice in a row (same colour and size: with solid discs, the same image);
    // - at most `max_run` trials in a row with the same disc colour, so that repeating the last
    //   answer cannot pass for a consistent percept.
    // (orderDepthTrials also supports `colored_before_purple`, for designs with strength 0 trials.)
    max_run: 2,
}

// --- Trial list --------------------------------------------------------------------------------
// Every strength level fully crossed with every level of each factor in `design.factors`, each cell
// `n_reps` times (a number, or an object giving it per strength level), with `sizeDesign.fixed`
// overridden by `design.fixed`, excluded combinations dropped (by the size task's rules), in an order
// that follows the rules above. Returns {trial, options} in the same form as makeTrials().
function makeDepthTrials(design, sizeDesign, width, height) {
    let cells = design.illusion_strength.map((strength) => ({ illusion_strength: strength }))
    for (const [name, levels] of Object.entries(design.factors || {})) {
        cells = cells.flatMap((cell) =>
            levels.map((level) => {
                const options = Object.assign({}, cell)
                applyLevel(options, name, level)
                return options
            }),
        )
    }
    const trials = []
    for (const cell of cells) {
        const reps = typeof design.n_reps === "number" ? design.n_reps : design.n_reps[cell.illusion_strength]
        for (let rep = 1; rep <= reps; rep++) {
            const options = Object.assign({}, sizeDesign.fixed, design.fixed, cell, {
                difference: design.difference,
                width: width,
                height: height,
                seed: randomInteger(0, 2 ** 31 - 1),
            })
            if (isExcluded(sizeDesign, options)) continue
            Chromostereopsis.parameters(options) // fail before the task starts, as in makeTrials()
            trials.push({ options: options })
        }
    }
    const ordered = orderDepthTrials(trials, design)
    ordered.forEach((trial, i) => (trial.trial = i + 1))
    return ordered
}

// --- Trial order -------------------------------------------------------------------------------
// Built one trial at a time, each picked at random among the remaining trials that break no rule;
// on a dead end (no trial fits) it starts again, which with the default design is rare.
function discColor(options) {
    const s = options.illusion_strength
    return s > 0 ? "red" : s < 0 ? "blue" : "purple"
}

// What makes two trials the same image (with solid discs the dither pattern does not show)
function depthCondition(options) {
    return [options.illusion_strength, options.size, options.density, options.outline].join("|")
}

function fitsDepthOrder(design, order, trial) {
    const o = trial.options
    const last = order[order.length - 1]
    if (last && depthCondition(last.options) === depthCondition(o)) return false
    const run = design.max_run
    if (run && order.length >= run && order.slice(-run).every((t) => discColor(t.options) === discColor(o))) {
        return false
    }
    if (discColor(o) === "purple" && design.colored_before_purple) {
        const seen = (color) => order.filter((t) => discColor(t.options) === color).length
        if (seen("red") < design.colored_before_purple || seen("blue") < design.colored_before_purple) return false
    }
    return true
}

function orderDepthTrials(trials, design) {
    for (let attempt = 0; attempt < 1000; attempt++) {
        const remaining = trials.slice()
        const order = []
        while (remaining.length > 0) {
            const fits = [...remaining.keys()].filter((i) => fitsDepthOrder(design, order, remaining[i]))
            if (fits.length === 0) break
            const i = fits[Math.floor(Math.random() * fits.length)]
            order.push(remaining.splice(i, 1)[0])
        }
        if (remaining.length === 0) return order
    }
    throw new Error("Could not order the depth trials under DEPTH_DESIGN's rules; relax max_run or colored_before_purple.")
}
