"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieDataFrame = void 0;
exports.CreateMovieDataFrame = CreateMovieDataFrame;
const movie_js_1 = require("./movie.js");
const observation_js_1 = require("./observation.js");
const movie_js_2 = require("./movie.js");
const movie_js_3 = require("./movie.js");
class MovieDataFrame {
    /**
     * @returns {Observer[]}
     */
    get observers() {
        return [
            this.showtimeObserver,
            this.genreObserver,
            this.actorObserver,
            this.ticketsObserver,
        ];
    }
    constructor({ movies, showtimeObserver, genreObserver, actorObserver, ticketsObserver, moveHistory: moveHistory, }) {
        this.movies = movies;
        this.actorObserver = actorObserver;
        this.showtimeObserver = showtimeObserver;
        this.genreObserver = genreObserver;
        this.ticketsObserver = ticketsObserver;
        this.moveHistory = moveHistory ? moveHistory : [];
        this._init();
    }
    _init() {
        this.probs = new Array(this.movies.length);
        let sumProbs = 0;
        for (let i = 0; i < this.movies.length; i++) {
            let movie = this.movies[i];
            let p = 1;
            for (let obs of this.observers) {
                p *= obs.getProbability(movie);
            }
            this.probs[i] = p;
            sumProbs += p;
        }
        let ent = 0;
        for (let i = 0; i < this.probs.length; i++) {
            this.probs[i] /= sumProbs;
            ent +=
                this.probs[i] > 0.00001 ? this.probs[i] * Math.log(this.probs[i]) : 0;
        }
        this.entropy = -ent;
        this.sumProbs = sumProbs;
        this.seekingEnergy = observation_js_1.registry.computeSeekingEnergyWeight(this.moveHistory, this.probs);
        this.energy = this.entropy - this.seekingEnergy;
    }
    //sorted from top: descending
    /**
     * @returns {[[Number, Movie]]}
     */
    get sortedMoviesAndProbabilities() {
        let movs = [];
        for (let i = 0; i < this.probs.length; i++) {
            movs.push([this.probs[i], this.movies[i]]);
        }
        movs.sort((i, j) => -i[0] + j[0]);
        return movs;
    }
    generateMoves() {
        return observation_js_1.registry.getValidMoves(this.moveHistory);
    }
    applyMove(move, result) {
        let args = {
            movies: this.movies,
            showtimeObserver: this.showtimeObserver,
            actorObserver: this.actorObserver,
            genreObserver: this.genreObserver,
            ticketsObserver: this.ticketsObserver,
            moveHistory: this.moveHistory,
        };
        const probWeight = observation_js_1.registry.execMove(move, result, args);
        const mdf = new MovieDataFrame(args);
        mdf.sumProbs *= probWeight;
        return mdf;
    }
    printTopMovies() {
        let movs = this.sortedMoviesAndProbabilities;
        movs.forEach((prob, mov) => {
            console.log(`${prob}: ${mov.toString()}`);
        });
    }
    /**
     *
     * @returns {[[Number, Movie]]}
     */
    getBestCandidateMoves() {
        let candMoves = [];
        for (let move of this.generateMoves()) {
            candMoves.push(move);
        }
        return candMoves
            .map((move) => {
            let falseBranch = this.applyMove(move, false);
            let trueBranch = this.applyMove(move, true);
            //max = Math.max(falseBranch.energy, trueBranch.energy);
            let p1 = falseBranch.sumProbs / (falseBranch.sumProbs + trueBranch.sumProbs);
            let p2 = trueBranch.sumProbs / (falseBranch.sumProbs + trueBranch.sumProbs);
            let max = p1 * falseBranch.energy + p2 * trueBranch.energy;
            return [max, move, falseBranch, trueBranch];
        })
            .sort(([a, __], [b, _]) => a - b);
    }
    hasProvenState() {
        return observation_js_1.registry.hasProvenCorrect(this.moveHistory);
    }
}
exports.MovieDataFrame = MovieDataFrame;
function CreateMovieDataFrame() {
    let frame = new MovieDataFrame({
        movies: movie_js_1.movies,
        genreObserver: new observation_js_1.GenreObserver(movie_js_2.genres.map((_, i) => i)),
        actorObserver: new observation_js_1.ActorObserver(movie_js_3.actors.map((_, i) => i)),
        ticketsObserver: new observation_js_1.TicketsObserver(),
        showtimeObserver: new observation_js_1.ShowtimeObserver(),
    });
    return frame;
}
