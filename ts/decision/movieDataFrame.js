import { Movie, movies } from "./movie.js";
import {
  Observer,
  ShowtimeObserver,
  GenreObserver,
  TagObserver,
  ActorObserver,
  TicketsObserver,
  registry,
} from "./observation.js";
import { genres } from "./movie.js";
import { actors } from "./movie.js";

export class MovieDataFrame {
  /**
   * @type {Movie[]}
   */
  movies;
  /**
   * @type {Number[]}
   */
  probs;
  /**
   * @type {ShowtimeObserver}
   */
  showtimeObserver;
  /**
   * @type {GenreObserver}
   */
  genreObserver;
  /**
   * @type {ActorObserver}
   */
  actorObserver;
  /**
   * @type {TicketsObserver}
   */
  ticketsObserver;
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
  /**
   * @type {Number}
   */
  entropy;
  /**
   *
   * @type {String[]}
   */
  moveHistory;
  constructor({
    movies,
    showtimeObserver,
    genreObserver,
    actorObserver,
    ticketsObserver,
    moveHistory: moveHistory,
  }) {
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
    this.seekingEnergy = registry.computeSeekingEnergyWeight(
      this.moveHistory,
      this.probs,
    );
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
    return registry.getValidMoves(this.moveHistory);
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
    const probWeight = registry.execMove(move, result, args);

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
        let p1 =
          falseBranch.sumProbs / (falseBranch.sumProbs + trueBranch.sumProbs);
        let p2 =
          trueBranch.sumProbs / (falseBranch.sumProbs + trueBranch.sumProbs);
        let max = p1 * falseBranch.energy + p2 * trueBranch.energy;
        return [max, move, falseBranch, trueBranch];
      })
      .sort(([a, __], [b, _]) => a - b);
  }
  hasProvenState() {
    return registry.hasProvenCorrect(this.moveHistory);
  }
}

export function CreateMovieDataFrame() {
  let frame = new MovieDataFrame({
    movies,
    genreObserver: new GenreObserver(genres.map((_, i) => i)),
    actorObserver: new ActorObserver(actors.map((_, i) => i)),
    ticketsObserver: new TicketsObserver(),
    showtimeObserver: new ShowtimeObserver(),
  });
  return frame;
}
