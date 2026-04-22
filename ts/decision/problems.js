// problems.js
import { movies } from "./movie.js";
const [
  action,
  comedy,
  drama,
  fantasy,
  horror,
  scifi,
  thriller,
  western,
  sports,
] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const [
  Joshua,
  Muppets,
  Max,
  Savit,
  Tean,
  Joseph,
  Donald,
  Arnold,
  Pluto,
  Baron,
] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const hasGenre = (movie, g) =>
  movie.genres === undefined || movie.genres.includes(g);
const hasActor = (movie, a) =>
  movie.actors === undefined || movie.actors.includes(a);
const hasTickets = (movie, n) =>
  movie.tickets === undefined || movie.tickets >= n;
const beforeTime = (movie, t) =>
  movie.startTime === undefined || movie.startTime < t;
const afterTime = (movie, t) =>
  movie.startTime === undefined || movie.startTime > t;
const atLeastTime = (movie, t) =>
  movie.startTime === undefined || movie.startTime >= t;
const notAtTime = (movie, t) =>
  movie.startTime === undefined || movie.startTime !== t;
const notBetweenTime = (movie, t1, t2) =>
  movie.startTime === undefined ||
  !(movie.startTime >= t1 && movie.startTime <= t2);

export const problems = [
  [
    "A horror film with at least 50 tickets available",
    (movie) => hasGenre(movie, horror) && hasTickets(movie, 50),
  ],
  [
    "A sci-fi film starring Joseph with at least 90 tickets",
    (movie) =>
      hasGenre(movie, scifi) &&
      hasActor(movie, Joseph) &&
      hasTickets(movie, 90),
  ],
  [
    "A comedy starting before 2 PM with at least 70 tickets",
    (movie) =>
      hasGenre(movie, comedy) && beforeTime(movie, 2) && hasTickets(movie, 70),
  ],
  [
    "A western or sports film with at least 100 tickets available",
    (movie) =>
      (hasGenre(movie, western) || hasGenre(movie, sports)) &&
      hasTickets(movie, 100),
  ],
  [
    "A drama starring Max with at least 60 tickets",
    (movie) =>
      hasGenre(movie, drama) && hasActor(movie, Max) && hasTickets(movie, 60),
  ],
  [
    "A fantasy film starting after 4 PM with at least 85 tickets",
    (movie) =>
      hasGenre(movie, fantasy) && afterTime(movie, 4) && hasTickets(movie, 85),
  ],
  [
    "An action film starring Arnold with at least 55 tickets",
    (movie) =>
      hasGenre(movie, action) &&
      hasActor(movie, Arnold) &&
      hasTickets(movie, 55),
  ],
  [
    "A thriller not starting at 2 PM, with at least 120 tickets",
    (movie) =>
      hasGenre(movie, thriller) &&
      notAtTime(movie, 2) &&
      hasTickets(movie, 120),
  ],
  [
    "A horror or thriller film starring Baron, with at least 30 tickets",
    (movie) =>
      (hasGenre(movie, horror) || hasGenre(movie, thriller)) &&
      hasActor(movie, Baron) &&
      hasTickets(movie, 30),
  ],
  [
    "A drama not starting at 3 PM, with at least 100 tickets",
    (movie) =>
      hasGenre(movie, drama) && notAtTime(movie, 3) && hasTickets(movie, 100),
  ],
  [
    "A western starring Tean, with at least 110 tickets",
    (movie) =>
      hasGenre(movie, western) &&
      hasActor(movie, Tean) &&
      hasTickets(movie, 110),
  ],
  [
    "A sports film not starting at 1 PM, with at least 115 tickets",
    (movie) =>
      hasGenre(movie, sports) && notAtTime(movie, 1) && hasTickets(movie, 115),
  ],
  [
    "A fantasy film starting before 3 PM, with at least 80 tickets",
    (movie) =>
      hasGenre(movie, fantasy) && beforeTime(movie, 3) && hasTickets(movie, 80),
  ],
  [
    "A comedy starring Muppets with at least 45 tickets",
    (movie) =>
      hasGenre(movie, comedy) &&
      hasActor(movie, Muppets) &&
      hasTickets(movie, 45),
  ],
  [
    "An action film not between 2 PM and 4 PM, with at least 65 tickets",
    (movie) =>
      hasGenre(movie, action) &&
      notBetweenTime(movie, 2, 4) &&
      hasTickets(movie, 65),
  ],
  [
    "A sci-fi or fantasy film starring Baron, with at least 100 tickets",
    (movie) =>
      (hasGenre(movie, scifi) || hasGenre(movie, fantasy)) &&
      hasActor(movie, Baron) &&
      hasTickets(movie, 100),
  ],
  [
    "A drama or sports film starting at 5 PM or later, with at least 110 tickets",
    (movie) =>
      (hasGenre(movie, drama) || hasGenre(movie, sports)) &&
      atLeastTime(movie, 5) &&
      hasTickets(movie, 110),
  ],
  [
    "A thriller starring Pluto, with at least 20 tickets",
    (movie) =>
      hasGenre(movie, thriller) &&
      hasActor(movie, Pluto) &&
      hasTickets(movie, 20),
  ],
  [
    "A horror film not at 3 PM, with at least 40 tickets",
    (movie) =>
      hasGenre(movie, horror) && notAtTime(movie, 3) && hasTickets(movie, 40),
  ],
  [
    "A western or action film starring Joshua, with at least 70 tickets",
    (movie) =>
      (hasGenre(movie, western) || hasGenre(movie, action)) &&
      hasActor(movie, Joshua) &&
      hasTickets(movie, 70),
  ],
  [
    "A comedy starting before 3 PM, with at least 75 tickets",
    (movie) =>
      hasGenre(movie, comedy) && beforeTime(movie, 3) && hasTickets(movie, 75),
  ],
  [
    "A sci-fi film starring Joseph, starting before 4 PM, with at least 90 tickets",
    (movie) =>
      hasGenre(movie, scifi) &&
      hasActor(movie, Joseph) &&
      beforeTime(movie, 4) &&
      hasTickets(movie, 90),
  ],
  [
    "A sports film starring Savit, not starting at 1 PM, with at least 30 tickets",
    (movie) =>
      hasGenre(movie, sports) &&
      hasActor(movie, Savit) &&
      notAtTime(movie, 1) &&
      hasTickets(movie, 30),
  ],
  [
    "A drama starring Max, not between 2 PM and 4 PM, with at least 55 tickets",
    (movie) =>
      hasGenre(movie, drama) &&
      hasActor(movie, Max) &&
      notBetweenTime(movie, 2, 4) &&
      hasTickets(movie, 55),
  ],
  [
    "A fantasy or horror film starting after 4 PM, with at least 80 tickets",
    (movie) =>
      (hasGenre(movie, fantasy) || hasGenre(movie, horror)) &&
      afterTime(movie, 4) &&
      hasTickets(movie, 80),
  ],
  [
    "A comedy or sports film not starting at 3 PM, with at least 60 tickets",
    (movie) =>
      (hasGenre(movie, comedy) || hasGenre(movie, sports)) &&
      notAtTime(movie, 3) &&
      hasTickets(movie, 60),
  ],
  [
    "An action film starting at 6 PM or later, with at least 65 tickets",
    (movie) =>
      hasGenre(movie, action) && atLeastTime(movie, 6) && hasTickets(movie, 65),
  ],
  [
    "A western starring Arnold or Tean, not between 3 PM and 5 PM, with at least 50 tickets",
    (movie) =>
      hasGenre(movie, western) &&
      (hasActor(movie, Arnold) || hasActor(movie, Tean)) &&
      notBetweenTime(movie, 3, 5) &&
      hasTickets(movie, 50),
  ],
  [
    "A horror film starring Baron, starting before 5 PM, with at least 25 tickets",
    (movie) =>
      hasGenre(movie, horror) &&
      hasActor(movie, Baron) &&
      beforeTime(movie, 5) &&
      hasTickets(movie, 25),
  ],
  [
    "A comedy starring Joshua, not between 3 PM and 5 PM, with at least 80 tickets",
    (movie) =>
      hasGenre(movie, comedy) &&
      hasActor(movie, Joshua) &&
      notBetweenTime(movie, 3, 5) &&
      hasTickets(movie, 80),
  ],
  [
    "A drama or thriller starting at 5 PM or later, with at least 50 tickets",
    (movie) =>
      (hasGenre(movie, drama) || hasGenre(movie, thriller)) &&
      atLeastTime(movie, 5) &&
      hasTickets(movie, 50),
  ],
  [
    "A sci-fi film not starting at 1 PM, with at least 70 tickets",
    (movie) =>
      hasGenre(movie, scifi) && notAtTime(movie, 1) && hasTickets(movie, 70),
  ],
  [
    "A thriller or horror film starring Pluto, starting before 5 PM, with at least 15 tickets",
    (movie) =>
      (hasGenre(movie, thriller) || hasGenre(movie, horror)) &&
      hasActor(movie, Pluto) &&
      beforeTime(movie, 5) &&
      hasTickets(movie, 15),
  ],
  [
    "A drama or sports film starring Savit, not at 6 PM, with at least 40 tickets",
    (movie) =>
      (hasGenre(movie, drama) || hasGenre(movie, sports)) &&
      hasActor(movie, Savit) &&
      notAtTime(movie, 6) &&
      hasTickets(movie, 40),
  ],
  [
    "A fantasy film starring Muppets, not starting at 5 PM, with at least 85 tickets",
    (movie) =>
      hasGenre(movie, fantasy) &&
      hasActor(movie, Muppets) &&
      notAtTime(movie, 5) &&
      hasTickets(movie, 85),
  ],
  [
    "An action film starring Joshua, not starting at 1 PM, with at least 55 tickets",
    (movie) =>
      hasGenre(movie, action) &&
      hasActor(movie, Joshua) &&
      notAtTime(movie, 1) &&
      hasTickets(movie, 55),
  ],
  [
    "A comedy starring Donald, starting at 3 PM or later, with at least 60 tickets",
    (movie) =>
      hasGenre(movie, comedy) &&
      hasActor(movie, Donald) &&
      atLeastTime(movie, 3) &&
      hasTickets(movie, 60),
  ],
];
