/// <reference path="../framework.ts" />
import {DB, Query} from "./db.js";
import * as Time from "./time.js";

// Helper functions

/**
 * @description Calculates the intersect (the common part) of Array A and B.
 * @param A 
 * @param B 
 * @returns The intersect of A and B
 */
function intersect<T>(A : Array<T>, B : Array<T>){
    // We first sort A and B in the default order, so that
    // we can use the ordering to simplify computation.
    const a = A.sort();
    const b = B.sort();

    // Initialize the result array to be returned
    let res : Array<T> = [];
    
    // Iterate over a and b
    let i = 0;
    let j = 0;

    // If i >= A.length or j >= B.length,
    // we have exhausted all possible equal entries,
    // so the algorithm is terminated
    while(i < A.length && j < B.length){
        // We found an equal entry! 
        if(a[i] == b[j]){
            // Add it to the result
            res.push(a[i]);
            // Move on to the next pair
            i++;
            j++;

            continue;
        }

        // Current a[i] is smaller than b[j] in the sorted list.
        // To find a[i] == b[j], we must go to the right of list a,
        // as a is a sorted list
        if(a[i] < b[j]){
            i++;
            continue;
        }

        // a[i] > b[j]
        // we should move on to the next entry in b for the same
        // reason as the previous case
        j++;
    }

    return res;
}

/**
 * MovieQuery is just a Query supporting the convinient scopes defined below.
 */
class MovieQuery extends Query<movieData>{
    public constructor(db : DB<movieData>){
        super(db);
    }

    public filter_by(filter_name : string, params = {}){
        this.where(scope.filter[filter_name](params));
        return this;
    }

    public sort_by(order_name : string, params = {}){
        this.order_by(scope.order[order_name](params));
        return this;
    }
}

/**
 * @description The model to handle all movie data. This model can be used to convieniently filter and order movies.
 */
export default class Movies{
    private db : DB<movieData>;

    public constructor(movies : Array<movieData>){
        this.db = new DB();
        this.db.create("Movie");
        this.db.insert_all("Movie", movies);
    }

    /**
     * @returns all genres occured
     */
    public get genres(){
        // Initializing the result array
        let genres = [];
        // We use a hashset to eliminate duplicates
        let set = {};
        
        // Loop through all records and add their genres that are not in the list to the result list
        const all_records = this.db.select_all().from("Movie").result;
        all_records.forEach(movie => {
            movie.genres.forEach(g => {
                // If set[g], then we have already added g
                if(set[g]){
                    return;
                }

                // Add g and record the adding
                genres.push(g);
                set[g] = true;
            });
        });
        
        // Sort genres in alphabetical order
        genres = genres.sort();

        return genres;
    }

    
    /**
     * @returns all actors occured
     */
    public get actors(){
        // Initializing the result array
        let actors = [];
        // We use a hashset to eliminate duplicates
        let set = {};
        
        // Loop through all records and add their actors that are not in the list to the result list
        const all_records = this.db.select_all().from("Movie").result;
        all_records.forEach(movie => {
            movie.actors.forEach(a => {
                // If set[g], then we have already added g
                if(set[a]){
                    return;
                }

                // Add g and record the adding
                actors.push(a);
                set[a] = true;
            });
        });
        
        // Sort actors in alphabetical order
        actors = actors.sort();

        return actors;
    }

    /**
     * @description
     * Query over all movies. You can apply scopes (filters/orders) to the query.  
     * 
     * @example
     * // Sample query:
     * // This query selects all movies that has "Animated" in its genre and then order the result alphabetically.
     * movie_model.select_all()
     *  .filter_by("genres", {include: ["Animated"]})
     *  .order_by("alphabetical")
     *  .result
     */
    public select_all(){
        let res = new MovieQuery(this.db);
        res.from("Movie");
        return res;
    }
}


// The following are the filters and orders you can apply to your queries.
// You can also define your own filters and orders.
// Alternatively, you can use directly use .order(...) or .where(...) since MovieQuery is just another Query.
type TimeRange = {
    before?: string;
    after?: string;
}

const scope = {
    // Filtering
    filter: {
        // Filter the movies by their movie length        
        "length": function({from, to}){
            if(!from){
                from = -Infinity;
            }
            if(!to){
                to = Infinity;
            }
            
            return function(movie : movieData){
                return from <= movie.movieLength && movie.movieLength <= to;
            }
        },

        // Filter the movies by their starting/ending time. 
        // The input parameter is in the form of {starts : {before, after}, ends : {before, after}}, where all fields are optional.
        // The time should be a string in the format of hh:mm
        // This scope is inclusive.
        "time": function({starts = {}, ends = {}} : {starts: TimeRange; ends: TimeRange}){
            // Parse the provided strings into Time. If it is not provided, just let it be the unlimited bound
            let starts_after : Time.Time = Time.parseTime(starts.after, -Time.Eternity);
            let starts_before : Time.Time = Time.parseTime(starts.before, Time.Eternity);
            let ends_after : Time.Time = Time.parseTime(ends.after, -Time.Eternity);
            let ends_before : Time.Time =Time.parseTime(ends.before, Time.Eternity);

            return function(movie : movieData){
                // If any of the time satisfies the given time range, return true
                for(let i = 0; i < movie.movieTimes.length; i++){
                    let s = Time.parseTime(movie.movieTimes[i]);
                    let e = Time.parseTime(movie.movieTimes[i]) + movie.movieLength;
                    if(starts_after <= s && s <= starts_before &&
                        ends_after <= e && e <= ends_before
                    ){
                        return true;
                    }
                }
                return false;
            }
        },

        // Filtering the movies by genres. If a movie has any genre in the provided list, it will be included
        "genres": function({include = [], exclude = []}){
            return function(movie : movieData){
                if(!include || !include.length){
                    return intersect(movie.genres, exclude).length == 0;
                }

                return intersect(movie.genres, include).length == include.length &&
                    intersect(movie.genres, exclude).length == 0;
            }
        },
        
        // Filtering the movies by actors. If a movie has any actors in the provided list, it will be included
        "actors": function({include = [], exclude = []}){
            return function(movie : movieData){
                if(!include || !include.length){
                    return intersect(movie.actors, exclude).length == 0;
                }

                return intersect(movie.actors, include).length == include.length &&
                    intersect(movie.actors, exclude).length == 0;
            }
        }
    },
        

   // Ordering
   order: {
        // Order the movies by how they match the provided actors and genres that are intended to be included.
        "relevance": function({actors = [], genres = []}){
            return function(a : movieData, b : movieData){
                let a_match = 
                    intersect(actors, a.actors).length +
                    intersect(genres, a.genres).length;
                let b_match = 
                    intersect(actors, b.actors).length +
                    intersect(genres, b.genres).length;

                return a_match > b_match;
            }
        },

        // Order the movies by their movie length
        "length": function(){
            return function(a : movieData, b : movieData){
                return a.movieLength < b.movieLength;
            }
        },

        // Order the movies alphabetically by their titles
        "alphabetical": function(){
            return function(a : movieData, b : movieData){
                return a.title < b.title;
            }
        },

        // Order the movies chronologically by their earliest start time in ascending order.
        "chronological": function(){
            return function(a : movieData, b : movieData){
                let a_time = a.movieTimes.map((x) => { return Time.parseTime(x) });
                let b_time = b.movieTimes.map((x) => { return Time.parseTime(x) });
                let a_min = a_time.reduce((a, b)=>{return Time.min(a, b)}, Time.Eternity);
                let b_min = b_time.reduce((a, b)=>{return Time.min(a, b)}, Time.Eternity);

                return a_min < b_min;
            }
        }
    }     
};