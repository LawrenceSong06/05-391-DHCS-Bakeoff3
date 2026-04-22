import { movies as rawMovies, numMainActors } from "./movies.js";
export const genres = [
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
export const actors = [
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
export class Movie {
  /**@type {Number} */
  startTime; //start time, hours PM
  /**@type {Number} */
  duration; //hours - floating point
  /**@type {Number[]} */
  genres;
  /**@type {Number[]} */
  actors;
  /**
   * @type {Number}
   */
  tickets;
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
    return `Movie Showing: [${this.startTime} - ${this.startTime + this.duration}]: ${this.genres.map((i) => genres[i]).join(",")} by ${this.actors.map((i) => actors[i]).join(",")}`;
  }
}
/**
 * @type {Movie[]}
 */
export const movies = [];
for (let entry of rawMovies) {
  for (let startTime of entry.showtimes) {
    movies.push(
      new Movie({
        ...entry,
        startTime,
      }),
    );
  }
}
