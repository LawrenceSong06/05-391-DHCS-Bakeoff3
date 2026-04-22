import { Movie, movies } from "./movie.js";
import { params } from "./params.js";
//Any time the user geneates an observation
export class Observer {
  /**
   * Abstract function
   * Returns the conditional likelihood that a certain movie is true given the current observation state
   * @param {Movie} movie
   */
  getProbability(movie) {}
  observe() {}
  /**
   * Contract: return value of getNextObservation, appended with passed/not passed, can be passed to observe
   * @param {Movie} movie
   */
  static getNextObservation(movie) {
    return [];
  }
  clone() {}
}
//Keeps track of conditional probabilities involving intervals
//If "safe" intervals are observed, we assume any movie duration outside the safe interval carries poisson-like risk
//If "failed" intervals are observed, we assume (independently for each interval), any intersection with that interval carries fixed risk
export class ShowtimeObserver extends Observer {
  /**
   * @type {[[Number,Number]]}
   */
  passedIntervals = [];
  /**
   * @type {[Number,Number]}
   */
  failedIntervals = [];
  /**
   *
   */
  constructor() {
    super();
  }
  observe(observation, passed) {
    let [startTime, endTime] = observation.split(",").map((i) => Number(i));
    let prob = this.getProbability({
      startTime,
      endTime,
      duration: endTime - startTime,
    });
    if (passed) {
      this.passedIntervals.push([startTime, endTime]);
      this.coalescePassedIntervals();
    } else {
      this.failedIntervals.push([startTime, endTime]);
    }
    return passed ? prob : 1 - prob;
  }
  /**
   *
   * @param {Movie} movie
   * @returns
   */
  static getNextObservation(movie) {
    return `${movie.startTime},${movie.endTime}`;
  }
  static name() {
    return "showtimeObserver";
  }
  coalescePassedIntervals() {
    if (this.passedIntervals.length === 0) return;
    this.passedIntervals.sort((a, b) => a[0] - b[0]);
    const merged = [this.passedIntervals[0]];
    for (let i = 1; i < this.passedIntervals.length; i++) {
      const current = this.passedIntervals[i];
      const last = merged[merged.length - 1];
      if (current[0] <= last[1]) {
        last[1] = Math.max(last[1], current[1]);
      } else {
        merged.push(current);
      }
    }
    this.passedIntervals = merged;
  }
  clone() {
    const copy = new ShowtimeObserver();
    copy.passedIntervals = this.passedIntervals.map((iv) => [iv[0], iv[1]]);
    copy.failedIntervals = this.failedIntervals.map((iv) => [iv[0], iv[1]]);
    return copy;
  }
  _computeOverlap(movie, st, et) {
    let latestStart = Math.max(movie.startTime, st);
    let earliestEnd = Math.min(movie.endTime, et);
    return Math.max(earliestEnd - latestStart, 0);
  }
  /**
   *
   * @param {Movie} movie
   */
  getProbability(movie) {
    let risk = 1;
    let passedOverlap = 0;
    for (let interval of this.passedIntervals) {
      passedOverlap += this._computeOverlap(movie, interval[0], interval[1]);
    }
    const unaccountedMovieTime = movie.duration - passedOverlap;
    risk *= Math.exp(-unaccountedMovieTime * params.showtimeTruePoisson);
    for (let interval of this.failedIntervals) {
      let intervalLength = interval[1] - interval[0];
      let blockerMustBeIn =
        intervalLength - this._computeOverlap(movie, interval[0], interval[1]);
      let blockerPercentageChance = blockerMustBeIn / intervalLength; // < 1, > 0
      risk *= Math.pow(
        blockerPercentageChance,
        params.showtimeFailedExpectedBlockers, //assume there are k independent blockers
      );
    }
    return Math.pow(risk, params.showtimePower);
  }
}
//Assumption: movie possible = sgn (sum w_i * tag[i]).
//implement perceptron algorithm
export class TagObserver extends Observer {
  /**
   *@type {Map<String, Number>}
   */
  perceptronWeights = new Map();
  bias = 0;
  prevTagLists = [];
  prevResults = [];
  constructor(tags) {
    super();
    for (let tag of tags) {
      this.perceptronWeights.set(tag, 0);
    }
  }
  observe(tagList, passed) {
    tagList = tagList.split(",").map((i) => Number(i));
    let param = { actors: tagList, genres: tagList };
    const prob = this.getProbability(param);
    this.prevTagLists.push(tagList);
    this.prevResults.push(passed);

    let iters = 0;
    for (iters = 0; iters < 5; iters++) {
      let converged = true;
      for (let i = 0; i < this.prevResults.length; i++) {
        let mistake = !this._train(this.prevTagLists[i], this.prevResults[i]);
        if (mistake) {
          converged = false;
        }
      }
      if (converged) break;
    }
    return passed ? prob : 1 - prob;
  }
  clone() {
    const copy = new this.constructor([]);
    copy.perceptronWeights = new Map(this.perceptronWeights);
    copy.bias = this.bias;
    copy.prevTagLists = [...this.prevTagLists];
    copy.prevResults = [...this.prevResults];
    return copy;
  }
  //tagList: interpret as vector with 1 if in list, 0 otherwise
  _train(tagList, passed) {
    const target = passed ? 1 : 0;
    //tagList:
    //predict
    let weight = this.bias;
    for (let tag of tagList) {
      weight += this.perceptronWeights.get(tag);
    }
    let pred = weight > 0 ? 1 : 0;
    let error = target - pred;
    if (error == 0) return true;
    for (let tag of tagList) {
      const newWeight = this.perceptronWeights.get(tag) + error * 1;
      this.perceptronWeights.set(tag, newWeight);
    }
    this.bias += error;
    return false;
  }
  /**
   * @param {String[]} movieTags
   */
  _isRuledOut(movieTags) {
    const tagSet = new Set(movieTags);
    for (let i = 0; i < this.prevResults.length; i++) {
      if (this.prevResults[i]) continue;
      const failedTags = this.prevTagLists[i];
      if (failedTags.every((tag) => tagSet.has(tag))) {
        return true;
      }
    }
    return false;
  }
}
export class GenreObserver extends TagObserver {
  constructor(genres) {
    super(genres);
  }
  /**
   *
   * @param {Movie} movie
   */
  getProbability(movie) {
    if (this._isRuledOut(movie.genres)) return 0;
    let weight = this.bias;
    for (let genre of movie.genres) {
      weight += this.perceptronWeights.get(genre);
    }
    return Math.pow(
      1 / (1 + Math.exp(-weight * params.genreSigmoidSharpness)),
      params.genrePower,
    );
  }
  /**
   *
   * @param {Movie} movie
   * @returns
   */
  static getNextObservation(movie) {
    return movie.genres
      .sort()
      .map((i) => String(i))
      .join(",");
  }
  static name() {
    return "genreObserver";
  }
}
export class ActorObserver extends TagObserver {
  constructor(actors) {
    super(actors);
  }
  /**
   *
   * @param {Movie} movie
   */
  getProbability(movie) {
    let weight = this.bias;
    if (this._isRuledOut(movie.actors)) return 0;
    for (let actor of movie.actors) {
      weight += this.perceptronWeights.get(actor);
    }
    return Math.pow(
      1 / (1 + Math.exp(-weight * params.actorSigmoidSharpness)),
      params.actorPower,
    );
  }
  /**
   *
   * @param {Movie} movie
   * @returns
   */
  static getNextObservation(movie) {
    return movie.actors
      .sort()
      .map((i) => String(i))
      .join(",");
  }
  static name() {
    return "actorObserver";
  }
}

export class TicketsObserver extends Observer {
  //we have observed that you need AT LEAST THIS MANY TICKETS
  maxConfFail = 0;
  minConfPass = 999;
  constructor() {
    super();
  }
  observe(observation, passed) {
    let tickets = Number(observation);
    let prob = this.getProbability({ tickets });
    if (passed && tickets < this.minConfPass) {
      this.minConfPass = tickets;
    } else if (!passed && tickets > this.maxConfFail) {
      this.maxConfFail = tickets;
    }
    return passed ? prob : 1 - prob;
  }
  /**
   *
   * @param {Movie} movie
   */
  static getNextObservation(movie) {
    return String(movie.tickets);
  }
  static name() {
    return "ticketsObserver";
  }
  clone() {
    let x = new TicketsObserver();
    x.maxConfFail = this.maxConfFail;
    x.minConfPass = this.minConfPass;
    return x;
  }
  /**
   *
   * @param {Movie} movie
   */
  getProbability(movie) {
    if (movie.tickets >= this.minConfPass) {
      return 1;
    }
    if (movie.tickets <= this.maxConfFail) {
      return 0;
    }
    // ✅ fixed: lerp now correctly maps maxConfFail → 0 and minConfPass → 1
    let lerp =
      (movie.tickets - this.maxConfFail) /
      (this.minConfPass - this.maxConfFail);
    return Math.pow(lerp, params.ticketsPower);
  }
}

export class Registry {
  moves = [];
  map = {};
  register(observer, movies) {
    for (let movie of movies) {
      const move = observer.name() + ":" + observer.getNextObservation(movie);
      this.moves.push(move);
      if (!this.map[move]) this.map[move] = new Set();
      this.map[move].add(movie);
    }
    this.moves = Array.from(new Set(this.moves));
  }
  execMove(move, passed, object) {
    let [obsName, action] = move.split(":");
    let newObserver = object[obsName].clone();
    let prob = newObserver.observe(action, passed);

    object[obsName] = newObserver;
    object.moveHistory = [...object.moveHistory];
    object.moveHistory.push([move, passed]);
    return prob;
  }
  getValidMoves(moveHistory) {
    let hist = new Set(moveHistory.map((x) => x[0]));
    return this.moves.filter((x) => !hist.has(x));
  }
  hasProvenCorrect(moveHistory) {
    let seenOnce = new Set();
    let seenTwice = new Set();
    let seenThrice = new Set();

    for (let [move, passed] of moveHistory) {
      if (!passed) continue;
      for (let movie of this.map[move]) {
        if (seenThrice.has(movie)) {
          return movie;
        } else if (seenTwice.has(movie)) {
          seenThrice.add(movie);
        } else if (seenOnce.has(movie)) {
          seenTwice.add(movie);
        } else {
          seenOnce.add(movie);
        }
      }
    }
    return null;
  }
  computeSeekingEnergyWeight(moveHistory, probs) {
    let seenOnce = new Set();
    let seenTwice = new Set();
    let seenThrice = new Set();
    let completed = new Set();
    for (let [move, passed] of moveHistory) {
      if (!passed) continue; // skip failed moves
      for (let movie of this.map[move]) {
        // iterate movies for this move
        if (seenThrice.has(movie)) {
          completed.add(movie);
        } else if (seenTwice.has(movie)) {
          seenThrice.add(movie);
        } else if (seenOnce.has(movie)) {
          seenTwice.add(movie);
        } else {
          seenOnce.add(movie);
        }
      }
    }
    let energy = 0;
    for (let i = 0; i < movies.length; i++) {
      if (seenOnce.has(movies[i])) {
        energy += params.s1_energy * probs[i];
      }
      if (seenTwice.has(movies[i])) {
        energy += params.s2_energy * probs[i];
      }
      if (seenThrice.has(movies[i])) {
        energy += params.s3_energy * probs[i];
      }
      if (completed.has(movies[i])) {
        energy += params.s4_energy * probs[i];
      }
    }
    return energy;
  }
}
export const registry = new Registry();

registry.register(ActorObserver, movies);
registry.register(GenreObserver, movies);
registry.register(ShowtimeObserver, movies);
registry.register(TicketsObserver, movies);
