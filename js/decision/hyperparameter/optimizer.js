"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.report = report;
const fs_1 = require("fs");
// ── Config ────────────────────────────────────────────────────────────────────
const LOG_PATH = "./optimizer_log.json";
const TEMPERATURE = 5;
const DEVIATION_SIGMA = 0.005;
const COLD_START_RUNS = 5;
// ── State ─────────────────────────────────────────────────────────────────────
let samples = [];
let best = null;
let currentParams = null;
let _liveParamsRef = null; // reference to the actual exported params object
// ── Param mutation ────────────────────────────────────────────────────────────
function applyToLiveParams(candidate) {
    // Mutate the real exported object in-place so all importers see the update
    for (const [k, v] of Object.entries(candidate)) {
        _liveParamsRef[k] = v;
    }
}
function formatNum(n) {
    if (n !== 0 && (Math.abs(n) < 0.01 || Math.abs(n) >= 10000)) {
        return n.toExponential(4);
    }
    return parseFloat(n.toPrecision(6)).toString();
}
// ── Log I/O ───────────────────────────────────────────────────────────────────
function loadLog() {
    var _a, _b;
    try {
        const raw = (0, fs_1.readFileSync)(LOG_PATH, "utf8");
        const data = JSON.parse(raw);
        samples = (_a = data.samples) !== null && _a !== void 0 ? _a : [];
        best = (_b = data.best) !== null && _b !== void 0 ? _b : null;
    }
    catch (_c) {
        samples = [];
        best = null;
    }
}
function saveLog() {
    (0, fs_1.writeFileSync)(LOG_PATH, JSON.stringify({ best, samples }, null, 2), "utf8");
    if (best) {
        const entries = Object.entries(best.params)
            .map(([k, v]) => `  ${k}: ${formatNum(v)},`)
            .join("\n");
        (0, fs_1.writeFileSync)("./best_params.js", `// Best loss: ${best.loss} (after ${samples.length} runs)\nexport const params = {\n${entries}\n};\n`, "utf8");
    }
}
// ── BM Core ───────────────────────────────────────────────────────────────────
function randGaussian() {
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function randomExplore(keys, anchor) {
    return Object.fromEntries(keys.map((k) => [
        k,
        anchor[k] * Math.exp(randGaussian() * DEVIATION_SIGMA * 2),
    ]));
}
function weightedMeanLogSpace(keys) {
    const weights = samples.map((s) => Math.exp(-s.loss / TEMPERATURE));
    const totalW = weights.reduce((a, b) => a + b, 0);
    return Object.fromEntries(keys.map((k) => {
        const logMean = samples.reduce((acc, s, i) => acc + Math.log(s.params[k]) * weights[i], 0) / totalW;
        return [k, Math.exp(logMean)];
    }));
}
function isDuplicate(candidate) {
    return samples.some((s) => Object.keys(candidate).every((k) => Math.abs(Math.log(s.params[k]) - Math.log(candidate[k])) < 1e-9));
}
function nextParams(keys, anchor) {
    let candidate;
    let attempts = 0;
    do {
        candidate =
            samples.length < COLD_START_RUNS
                ? randomExplore(keys, anchor)
                : (() => {
                    const mean = weightedMeanLogSpace(keys);
                    return Object.fromEntries(keys.map((k) => [
                        k,
                        mean[k] * Math.exp(randGaussian() * DEVIATION_SIGMA),
                    ]));
                })();
        attempts++;
    } while (attempts < 50 && isDuplicate(candidate));
    return candidate;
}
// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Call once at startup before the first test run.
 * @param {object} liveParams  The actual exported `params` object from params.js.
 *                             Its keys will be mutated in-place by the optimizer.
 */
function init(liveParams) {
    _liveParamsRef = liveParams;
    loadLog();
    // Snapshot current values as the starting candidate
    currentParams = { ..._liveParamsRef };
    const keys = Object.keys(currentParams);
    if (isDuplicate(currentParams)) {
        console.log("[optimizer] Current params already tested — generating new candidate.");
        currentParams = nextParams(keys, currentParams);
        applyToLiveParams(currentParams);
    }
    console.log(`[optimizer] Ready. ${samples.length} historical samples.`);
    console.log(`[optimizer] Active params:  ${fmtParams(currentParams)}`);
    if (best) {
        console.log(`[optimizer] Current best: loss=${best.loss}`);
        console.log(`[optimizer]   best params: ${fmtParams(best.params)}`);
        console.log(`[optimizer] ↕  delta from best: ${fmtDelta(currentParams, best.params)}`);
    }
    saveLog();
}
/**
 * Call after each test run completes.
 * @param {number} loss  The number of tries required (lower = better).
 */
function report(loss) {
    if (!currentParams || !_liveParamsRef)
        throw new Error("[optimizer] Call init(params) before report().");
    samples.push({ params: currentParams, loss });
    const isNewBest = !best || loss < best.loss;
    if (isNewBest) {
        best = { params: { ...currentParams }, loss };
        console.log(`\n[optimizer] ★ New best! loss=${loss}`);
        console.log(`[optimizer]   best params: ${fmtParams(best.params)}`);
    }
    else {
        console.log(`\n[optimizer] loss=${loss}  (best=${best.loss}, runs=${samples.length})`);
        console.log(`[optimizer]   this run:   ${fmtParams(currentParams)}`);
        console.log(`[optimizer]   best so far: ${fmtParams(best.params)}`);
        console.log(`[optimizer]   delta from best: ${fmtDelta(currentParams, best.params)}`);
    }
    // Advance to next candidate and mutate the live object
    const keys = Object.keys(currentParams);
    currentParams = nextParams(keys, currentParams);
    applyToLiveParams(currentParams);
    console.log(`[optimizer] → Next candidate: ${fmtParams(currentParams)}`);
    saveLog();
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtParams(p) {
    return Object.entries(p)
        .map(([k, v]) => `${k}=${formatNum(v)}`)
        .join("  ");
}
function fmtDelta(current, reference) {
    return Object.entries(current)
        .map(([k, v]) => {
        const ratio = v / reference[k];
        const pct = ((ratio - 1) * 100).toFixed(1);
        const sign = ratio >= 1 ? "+" : "";
        return `${k}=${sign}${pct}%`;
    })
        .join("  ");
}
