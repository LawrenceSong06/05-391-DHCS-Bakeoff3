/// <reference path="framework.ts" />
import Movies from "./data/model.js";
import * as Templete from "./templetes.js"
import * as Helpers from "./helpers.js"
import { min } from "./data/time.js";

//  ============= CHANGED (start) ==============
// You can define some test movies (here, or in a .js file loaded before this one in the html) and pass them into the Trial engine to test different movie datasets.
const testMovies : Array<movieData> = [
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
	},{
		title: "Tank Girl",
		movieTimes: ["04:30", "12:42"],
		movieLength: 104,
		genres: ["sci-fi", "dark comedy"],
		description: "A girl is among the few survivors of a dystopian Earth. Riding a war tank, she fights against the tyranny of a mega-corporation that dominates the remaining potable water supply of the planet.",
		actors: ["Lori Petty","Ice-T", "Naomi Watts", "Malcolm McDowell"]
	}
]
//  ============= CHANGED (end) ==============

// As always, we add our parts within a "load" event to make sure the HTML stuff has loaded first. 
window.addEventListener("load", async (e: Event) => {
	// Get references to the HTML elements that we need.
	const titleSelect = document.getElementById("titleSelect") as HTMLSelectElement;
	const timeSelect = document.getElementById("timeSelect") as HTMLSelectElement;
	const submitButton = document.getElementById("submit") as HTMLButtonElement;
	const numberOfTicketsTextBox = document.getElementById("numberOfTickets") as HTMLInputElement;
	const userNameTextBox = document.getElementById("userName") as HTMLInputElement;

	const movieInfoDiv = document.getElementById("movieInfo") as HTMLDivElement;

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
	const movies : Array<movieData> = await trial.getMovies(); // 👈 note the word "await" in this line ✅

	// Create the movie data model that can be used in the future to
	// query over all movies and apply filters and orders.
	//
	// The Movie model is just a wrapper for a "database" of movies that gives us some convinient functions.
	let Movie : Movies = new Movies(movies);

	// Getting all genres and actors
	// This will later be used to add UI for the filters and orders
	let genres : Array<string> = Movie.genres;
	let actors : Array<string> = Movie.actors;

	// Some key components of the page:
	let filter_sort_form : HTMLFormElement = document.getElementById("filter-sort") as HTMLFormElement;
	let movie_index : HTMLDivElement = document.getElementById("movie_index") as HTMLDivElement;
	let movie_detail : HTMLDivElement = document.getElementById("movie_detail") as HTMLDivElement;

	// Generating filters for each genre, and put them into the genre filter form
	// so that the user can access them through the UI
	let genre_form = document.getElementById("genre-form");
	genres.forEach(g => {
		genre_form.appendChild(Templete.create_genre_filter(g));
	});

	// The reverse order option in the order form
	let reverse_order = document.getElementById("reverse-order");
	let reverse_order_check : HTMLInputElement= reverse_order.querySelector("input[type='checkbox']");
	reverse_order.addEventListener("click", ()=>{
		reverse_order_check.checked = !reverse_order_check.checked;
		reverse_order.classList.toggle("active");
	});

	// All switches (defined by class). A switch is a div with two radio buttons in it.
	// Every click on a switch "switches" the chosen radio button
	let switches = Array.from(document.getElementsByClassName("switch"));
	switches.forEach((s) => {
		s.addEventListener("click", ()=>{
			console.log(1);
			let labels = Array.from(s.getElementsByTagName("label"));
			labels.forEach(l => {
				l.classList.toggle("active");
			});

			let radios = Array.from(s.getElementsByTagName("input"));
			radios.forEach(r => {
				r.checked = !r.checked;
			});
		});
	});
	
	// Min and max length
	{
		let min_length : HTMLInputElement = document.getElementById("min-length") as HTMLInputElement;
		let min_length_label = document.getElementById("min-length-label");
		let max_length : HTMLInputElement = document.getElementById("max-length") as HTMLInputElement;
		let max_length_label = document.getElementById("max-length-label");
	
		let max = Movie.select_all().sort_by("length").result.reverse()[0].movieLength;
		max_length.max = `${max}`;
		min_length.max = `${max}`;
		max_length.value = max_length.max;
	
		max_length_label.innerText = max_length.value + " min";
		min_length_label.innerText = min_length.value + " min";
	
	
		min_length.addEventListener("input", ()=>{
			if(parseInt(min_length.value) > parseInt(max_length.value)){
				min_length.value = max_length.value;
			}
			min_length_label.innerText = min_length.value + " min";
		});
		max_length.addEventListener("input", ()=>{
			if(parseInt(max_length.value) < parseInt(min_length.value)){
				max_length.value = min_length.value;
			}
			max_length_label.innerText = max_length.value + " min";
		});
	}

	// ========= Actor Searching ==========	
	let included_actors : HTMLDivElement = document.getElementById("included_actors") as HTMLDivElement;
	let excluded_actors : HTMLDivElement = document.getElementById("excluded_actors") as HTMLDivElement;
	let search_actor_input : HTMLInputElement = document.getElementById("search_actor") as HTMLInputElement;
	let actor_prompts : HTMLDivElement = document.getElementById("actor_prompts") as HTMLDivElement;

	function load_actor_prompts(){
		let target = search_actor_input.value;

		// Return the 5 actors that is searched by the user most possibly
		let search_actors = actors.map((a)=>{
			return [Helpers.string_difference(target, a), a];
		});
		
		search_actors.sort((a, b)=>{
			return a[0] - b[0];
		});
		
		let res = search_actors.slice(0, 5).map((a)=>{return a[1]});
		
		actor_prompts.replaceChildren();
		res.forEach(a => {
			let select_a = Templete.create_actor_select(a);
			select_a.addEventListener("click", ()=>{
				let data = new FormData(filter_sort_form);
				if(
					data.getAll("includes-actors").indexOf(a) != -1 || 
					data.getAll("excludes-actors").indexOf(a) != -1
				){
					return;
				}
				
				const opt = data.get("actor-option");
				if(opt == "include"){
					included_actors.appendChild(Templete.create_selected_actor(a, opt));
				}else{
					excluded_actors.appendChild(Templete.create_selected_actor(a, opt));
				}
			});

			actor_prompts.appendChild(select_a);
		});
	}
	load_actor_prompts();
	search_actor_input.addEventListener("input", (e)=>{
		load_actor_prompts();
	});
	

	function insert_index_card(movie){
		let index_card = Templete.create_index_card(movie);
		movie_index.appendChild(index_card);

		index_card.addEventListener("click", ()=>{
			movie_detail.replaceChildren(Templete.create_detail(movie, trial));
		});
	}

	// ============= Application of Filter&Sort ==============
	let apply_filter_and_sort = document.getElementById("filter-sort-apply");
	apply_filter_and_sort.addEventListener("click", ()=>{
		// Fetching data from the form
		let data = new FormData(filter_sort_form);
		
		let genres = data.getAll("includes-genres");
		let actors = data.getAll("includes-actors");

		let start_time_after = data.get("start-time-after");
		let start_time_before = data.get("start-time-before");

		let end_time_after = data.get("end-time-after");
		let end_time_before = data.get("end-time-before");

		let min_length = data.get("min-length");
		let max_length = data.get("max-length");

		let sort : string = data.get("sort") as string;

		let reverse_order : boolean = data.get("reverse-order") === "on";

		// Querying Movies
		let res = Movie.select_all()
		.filter_by("genres", {include: genres})
		.filter_by("actors", {include: actors})
		.filter_by("time", {
			starts: {after: start_time_after, before: start_time_before},
			ends: {after: end_time_after, before: end_time_before}
		})
		.filter_by("length", {from: min_length, to: max_length})
		.sort_by(sort, {actors: actors, genres: genres})
		.result;

		if(reverse_order){
			res = res.reverse();
		}

		movie_index.replaceChildren();
		if(res.length == 0){
			let notice = document.createElement("h4");
			notice.classList.add("span-width");
			notice.classList.add("center");
			notice.innerText = "No matching result. Maybe try some other filters?";
			movie_index.appendChild(notice);

			return;
		}

		// Updating index
		res.forEach(movie => {
			insert_index_card(movie);
		});

		movie_index.scrollTo({top: 0, behavior: "smooth"});
	});

	// We first insert something into movie index, so that is is not empty at the beginning
	Movie.select_all().sort_by("alphabetical").result.forEach((movie)=>{
		insert_index_card(movie);
	})
	// Variable to store the current movie selection.
	let currentlySelectedMovie : movieData;

	
	// Adding click events for the dropdown toggles. They should be able to toggle relevent dropdown.
	Array.from(document.querySelectorAll(".toggle-dropdown")).forEach((element : HTMLButtonElement)=>{
		element.addEventListener("click", (event) => {
			element.parentElement.closest(".dropdown").classList.toggle("active");
		});
	})
});
