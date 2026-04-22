"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Solver = Solver;
const movieDataFrame_js_1 = require("./movieDataFrame.js");
const observation_js_1 = require("./observation.js");
const movie_js_1 = require("./movie.js");
let prints = false;
async function Solver(io) {
    let frame = (0, movieDataFrame_js_1.CreateMovieDataFrame)();
    let tries = 0;
    while (true) {
        if (prints)
            frame.printTopMovies();
        let moves = frame.getBestCandidateMoves();
        await io.display(moves[0][1]);
        for (let i = 0; i < moves.length; i++) {
            if (!prints)
                break;
            console.log(moves[i][1], moves[i][0], moves[i][2].sumProbs, moves[i][3].sumProbs);
        }
        let isCorrect = await io.input();
        let f2 = frame.applyMove(moves[0][1], isCorrect);
        tries++;
        frame = f2;
        let movie = frame.hasProvenState();
        if (movie)
            return [movie, tries];
    }
}
