import { problems as rawProblems } from "../problems.js";
import { movies } from "../movie.js";
import { Solver } from "../solver.js";
import {init, report} from "./optimizer.js"
import {params} from "../params.js"

export const problems = rawProblems.filter((x) => {
  let [str, filter] = x;
  let counter = 0;
  for (let movie of movies) {
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
      if (!movie) throw "panic";
      let result = filter(movie);
      //console.log({ question, result });
      return result;
    },
  };
  let [movie, tries] = await Solver(io);
  if (!filter(movie)) throw "error";
  //console.log(movie, tries);
  return tries;
}

async function runTestSuite() {
  let tries = 0;
  for (let problem of problems) {
    tries += await runSolverForProblem(problem[1]);
  }
  //console.log(tries);
  return tries;
}


async function runTrainer() {
  init(params)
  while(true) {
    let loss = await runTestSuite()
    report(loss)
  }
}

await runTrainer()