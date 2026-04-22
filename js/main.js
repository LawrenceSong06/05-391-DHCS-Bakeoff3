/// <reference path="framework.ts" />
import Movies from "./data/model.js";
//  ============= CHANGED (start) ==============
// You can define some test movies (here, or in a .js file loaded before this one in the html) and pass them into the Trial engine to test different movie datasets.
const testMovies = [
    {
        title: "Labyrinth",
        movieTimes: ["04:30", "16:30"],
        movieLength: 101,
        genres: ["fantasy", "musical"],
        description: "Teenage Sarah journeys through a maze to save her baby brother from the Goblin King.",
        actors: ["Jennifer Connelly", "David Bowie", "muppets"]
    },
    {
        title: "Brand Upon the Brain!",
        movieTimes: ["14:32", "18:02"],
        movieLength: 95,
        genres: ["experimental"],
        description: "Returned home to his long-estranged mother upon a request from her deathbed, a man raised by his parents in an orphanage has to confront the childhood memories that have long haunted him.",
        actors: ["Guy Maddin"]
    }, {
        title: "Tank Girl",
        movieTimes: ["04:30", "12:42"],
        movieLength: 104,
        genres: ["sci-fi", "dark comedy"],
        description: "A girl is among the few survivors of a dystopian Earth. Riding a war tank, she fights against the tyranny of a mega-corporation that dominates the remaining potable water supply of the planet.",
        actors: ["Lori Petty", "Ice-T", "Naomi Watts", "Malcolm McDowell"]
    }
];
//  ============= CHANGED (end) ==============
// As always, we add our parts within a "load" event to make sure the HTML stuff has loaded first. 
window.addEventListener("load", async (e) => {
    // Get references to the HTML elements that we need.
    const titleSelect = document.getElementById("titleSelect");
    const timeSelect = document.getElementById("timeSelect");
    const submitButton = document.getElementById("submit");
    const numberOfTicketsTextBox = document.getElementById("numberOfTickets");
    const userNameTextBox = document.getElementById("userName");
    const movieInfoDiv = document.getElementById("movieInfo");
    //  ============= CHANGED (start) ==============
    // When you make the new "Trial", you can pass it in a test movie set (that you have written) during testing, like this:
    // const trial = new Trial("teamName", testMovies, false);
    // For the actual bakeoff, you should *not* pass in the test set, so it will retrieve "real" ones from the server. You can also turn off the "debug" boolean. So here is the version of the above line that should be used during the real Bakeoff (but with your actual teamName of course):
    const trial = new Trial("teamName");
    //  ============= CHANGED (end) ==============
    // getMovies is a function defined by the framework script. 
    // It will return a list of movies (in no guaranteed order). Each movie will be an object shaped like this:
    // {
    // 		title: string,
    // 		movieTimes: list of movie start times, represented as a 24-hour time string (https://developer.mozilla.org/en-US/docs/Web/HTML/Date_and_time_formats#time_strings) like "16:00",
    //  	movieLength: number (in minutes),
    // 		genres: list of strings,
    //  	description: string,
    //  	actors: list of strings
    // 	}
    // CHANGED: It is an async function (because it will poll a server) so it 
    // -----> **must** be awaited <------
    const movies = await trial.getMovies(); // 👈 note the word "await" in this line ✅
    // Create the movie data model that can be used in the future to
    // query over all movies and apply filters and orders.
    //
    // The model is just a wrapper for a "database" of movies.
    let movie_model = new Movies();
    // Insert all movies into the model.
    movie_model.insert_all(movies);
    // Variable to store the current movie selection.
    let currentlySelectedMovie;
    Array.from(document.querySelectorAll(".toggle-dropdown")).forEach((element) => {
        console.log(element);
        element.addEventListener("click", (event) => {
            element.parentElement.closest(".dropdown").classList.toggle("active");
        });
    });
    // When the user clicks the submit button, 
    submitButton.addEventListener("click", (event) => {
        // bundle up everything the Judge wants to see: the movie [a full movie object with all the metadata], the movieTime, the numberOfTickets (*as a number*), and the userName
        const userData = {
            movie: currentlySelectedMovie, // this should be the entire "movie" object, as described in lines 17-24 above
            movieTime: timeSelect.value, // a string
            numberOfTickets: parseInt(numberOfTicketsTextBox.value), // a number
            userName: userNameTextBox.value // a string
        };
        // ...and submit it to the Judge. 
        // ===> Your code *must*, somewhere/somehow, call this: <===
        trial.submitMovieChoice(userData);
    });
});
