# Version 2 change notes:

1) The framework now retrieves the generated movie list from a server, which is a process that can take time. Therefore you *must* use the word "await" in the line with trial.getMovies(), like this:
```js
	const movies = await trial.getMovies(); // JS version, line 63 in the sample main.js
```
```ts
	const movies : Array<movieData> = await trial.getMovies(); // TS version, line 63 in the sample main.ts
```

2) The framework now optionally allows you to load in your own test movie set (that you have hopefully developed to user-test with) as the second argument to making the new Trial object:
```js
	const trial = new Trial("teamName", testMovies, true); // "testMovies" is an array of movies, like the example at the beginning of main.[js/ts]
	// (The third argument continues to be "verbosity": "true" means that more nitpicky console logs will be shown.)
```
For the actual in-class Bakeoff, you *must* remove that test data, so that your code will instead do the retrieval from the server:
```js
	const trial = new Trial("teamName"); // with your actual team name instead of teamName, of course
```

3) If you are using Typescript, note that there is a slight change in tsconfig.json ("target" is now "es2018" to support native "await").