"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movies = exports.Movie = exports.actors = exports.genres = void 0;
const movies_js_1 = require("./movies.js");
exports.genres = [
    "action",
    "comedy",
    "drama",
    "fantasy",
    "horror",
    "scifi",
    "thriller",
    "western",
    "sports",
];
exports.actors = [
    "Joshua",
    "Muppets",
    "Max",
    "Savit",
    "Tean",
    "Joseph",
    "Donald",
    "Arnold",
    "Pluto",
    "Baron",
];
//Represnts an individual selectable viewing of a movies
class Movie {
    constructor(entry) {
        this.startTime = entry.startTime;
        this.duration = entry.runningTime;
        this.genres = entry.genres;
        this.actors = entry.mainActors;
        this.tickets = entry.availableTickets;
    }
    get endTime() {
        return this.startTime + this.duration;
    }
    toString() {
        return `Movie Showing: [${this.startTime} - ${this.startTime + this.duration}]: ${this.genres.map((i) => exports.genres[i]).join(",")} by ${this.actors.map((i) => exports.actors[i]).join(",")}`;
    }
}
exports.Movie = Movie;
/**
 * @type {Movie[]}
 */
exports.movies = [];
for (let entry of movies_js_1.movies) {
    for (let startTime of entry.showtimes) {
        exports.movies.push(new Movie({
            ...entry,
            startTime,
        }));
    }
}
