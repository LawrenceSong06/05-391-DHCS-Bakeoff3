"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const solver_js_1 = require("./solver.js");
const movie_js_1 = require("./movie.js");
const problems_js_1 = require("./problems.js");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const io = {
    display: async function (data) {
        let [type, dat] = data.split(":");
        if (type == "showtimeObserver") {
            console.log(`Would a movie from ${dat[0]} to ${dat[1]} be acceptable? (y/n)`);
        }
        if (type == "actorObserver") {
            console.log(`Would a movie starring actors ${dat.split(",").map(x => movie_js_1.actors[x])} be acceptable? (y/n)`);
        }
        if (type == "genreObserver") {
            console.log(`Would a movie with genres ${dat.split(",").map(x => movie_js_1.genres[x])} be acceptable? (y/n)`);
        }
        if (type == "ticketsObserver") {
            console.log(`Would a movie with ${dat} tickets available be acceptable? (y/n)?`);
        }
    },
    input: function () {
        return new Promise((resolve, reject) => {
            rl.question("", (answer) => {
                const normalized = answer.trim().toLowerCase();
                if (normalized === "right" || normalized === "y") {
                    resolve(true);
                }
                else if (normalized === "left" || normalized === "n") {
                    resolve(false);
                }
                else {
                    reject(new Error(`Unrecognized input: "${answer}". Expected y or n.`));
                }
            });
        });
    },
};
async function replLoop(numProblems) {
    for (let i = 0; i < numProblems; i++) {
        console.log("Your movie requirements:");
        console.log(problems_js_1.problems[i][0]);
        let [movie, tries] = await (0, solver_js_1.Solver)(io);
        let passed = problems_js_1.problems[i][1](movie);
        console.log(passed ? "PASSED" : "FAILED", ` You got the answer in ${tries} tries`);
    }
}
await replLoop(10); //number of questions for the user tests, 31 questions are available
rl.close();
