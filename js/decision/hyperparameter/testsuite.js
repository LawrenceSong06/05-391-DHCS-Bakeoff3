"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.problems = void 0;
const problems_js_1 = require("../problems.js");
const movie_js_1 = require("../movie.js");
const solver_js_1 = require("../solver.js");
const optimizer_js_1 = require("./optimizer.js");
const params_js_1 = require("../params.js");
exports.problems = problems_js_1.problems.filter((x) => {
    let [str, filter] = x;
    let counter = 0;
    for (let movie of movie_js_1.movies) {
        if (filter(movie)) {
            counter++;
        }
    }
    //console.log(counter);
    if (counter == 0 || counter > 20) {
        return false;
    }
    return true;
});
async function runSolverForProblem(filter) {
    let question;
    let io = {
        display: async (data) => {
            question = data;
            //console.log(data);
        },
        input: async () => {
            let [type, query] = question.split(":");
            let movie;
            if (type == "ticketsObserver") {
                let tickets = Number(query);
                movie = { tickets };
            }
            if (type == "showtimeObserver") {
                let [startTime, endTime] = query.split(",").map(Number);
                movie = { startTime, endTime, duration: endTime - startTime };
            }
            if (type == "genreObserver") {
                let genres = query.split(",").map(Number);
                movie = { genres };
            }
            if (type == "actorObserver") {
                let actors = query.split(",").map(Number);
                movie = { actors };
            }
            if (!movie)
                throw "panic";
            let result = filter(movie);
            //console.log({ question, result });
            return result;
        },
    };
    let [movie, tries] = await (0, solver_js_1.Solver)(io);
    if (!filter(movie))
        throw "error";
    //console.log(movie, tries);
    return tries;
}
async function runTestSuite() {
    let tries = 0;
    for (let problem of exports.problems) {
        tries += await runSolverForProblem(problem[1]);
    }
    //console.log(tries);
    return tries;
}
async function runTrainer() {
    (0, optimizer_js_1.init)(params_js_1.params);
    while (true) {
        let loss = await runTestSuite();
        (0, optimizer_js_1.report)(loss);
    }
}
await runTrainer();
