/**
 * @description creates a filter checkbox using the following templete:
 *      <div class="btn round noborder">
 *  	    <input type="checkbox" name="`option`">
 *			<span class="iconfont checkmark">&#xe630;</span>
 *			<label for="`option`">`option`</label>
 *		</div>
 * @param `genre`
 * @returns an HTML element
 */
export function create_genre_filter(genre) {
    let res = document.createElement("div");
    res.classList.add("btn");
    res.classList.add("round");
    res.classList.add("noborder");
    res.classList.add("flex");
    res.classList.add("flex-row");
    res.classList.add("flex-align-center");
    res.classList.add("flex-nowrap");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "includes-genres";
    checkbox.value = genre;
    res.appendChild(checkbox);
    let checkmark = document.createElement("div");
    checkmark.classList.add("iconfont");
    checkmark.classList.add("checkmark");
    res.appendChild(checkmark);
    let label = document.createElement("label");
    label.htmlFor = genre;
    label.innerText = genre;
    res.appendChild(label);
    res.addEventListener("click", (e) => {
        checkbox.checked = !checkbox.checked;
    });
    return res;
}
export function create_actor_select(actor) {
    let res = document.createElement("p");
    res.classList.add("btn");
    res.classList.add("padding_5");
    res.classList.add("grey");
    res.classList.add("noborder");
    res.classList.add("half-margin");
    res.innerText = actor;
    return res;
}
export function create_selected_actor(actor) {
    let res = document.createElement("div");
    res.classList.add("grey");
    res.classList.add("half-margin");
    res.classList.add("btn");
    res.classList.add("noborder");
    res.style.display = "inline-block";
    res.innerText = actor;
    let data = document.createElement("input");
    data.name = "includes-actors";
    data.type = "hidden";
    data.value = actor;
    res.appendChild(data);
    res.addEventListener("click", () => {
        res.remove();
    });
    return res;
}
export function create_tags(title, tags) {
    let res = document.createElement("div");
    res.classList.add("flex");
    res.classList.add("flex-row");
    res.classList.add("flex-nowrap");
    let strong = document.createElement("strong");
    strong.style.paddingRight = ".5em";
    strong.classList.add("flex");
    strong.classList.add("flex-column");
    strong.classList.add("flex-justify-start");
    strong.classList.add("margin-half");
    strong.innerText = title;
    res.appendChild(strong);
    let div = document.createElement("div");
    div.classList.add("flex");
    div.classList.add("flex-row");
    res.appendChild(div);
    tags.forEach(t => {
        let span = document.createElement("span");
        span.classList.add("round");
        span.classList.add("g3");
        span.style.margin = ".2em .2em .2em .2em";
        span.style.padding = ".5ex";
        span.innerText = t;
        div.appendChild(span);
    });
    return res;
}
export function create_paragraph(title, text) {
    let res = document.createElement("div");
    res.classList.add("flex");
    res.classList.add("flex-row");
    res.classList.add("flex-nowrap");
    res.classList.add("flex-justify-start");
    let strong = document.createElement("strong");
    strong.style.paddingRight = ".5em";
    strong.innerText = title;
    res.appendChild(strong);
    let span = document.createElement("span");
    span.innerText = text;
    res.appendChild(span);
    return res;
}
export function create_index_card(movie) {
    // The container
    let res = document.createElement("div");
    res.classList.add("btn");
    res.classList.add("noborder");
    res.classList.add("double-margin");
    res.classList.add("padding1");
    res.classList.add("g1");
    res.classList.add("round");
    // The title of the movie
    let title = document.createElement("h3");
    title.innerText = movie.title;
    res.appendChild(title);
    // Detail
    let tags = document.createElement("div");
    tags.classList.add("margin");
    tags.classList.add("flex");
    tags.classList.add("flex-column");
    tags.style.borderLeft = "solid 2px black";
    tags.style.maxHeight = "50em";
    tags.style.minHeight = "50px";
    tags.style.paddingLeft = "1em";
    tags.style.overflow = "hidden";
    res.appendChild(tags);
    tags.append(create_tags("Genre(s):", movie.genres));
    tags.append(create_tags("Length:", [movie.movieLength + " min"]));
    tags.append(create_tags("Actors:", movie.actors));
    return res;
}
export function create_detail(movie, trial) {
    // The container
    let res = document.createElement("div");
    res.className = "noborder round span-height flex flex-column";
    // The title of the movie
    let title = document.createElement("div");
    title.className = "flex flex-column flex-align-center span-width padding2";
    let icon = document.createElement("h2");
    icon.className = "iconfont padding1";
    icon.innerHTML = "&#xe6a3;";
    title.appendChild(icon);
    let title_text = document.createElement("h2");
    title_text.className = "nopadding";
    title_text.innerText = movie.title;
    title.appendChild(title_text);
    res.appendChild(title);
    res.appendChild(document.createElement("hr"));
    // The other details of the movie
    let details = document.createElement("div");
    details.className = "span-width overflow-y-scroll overflow-x-hidden flex-fill scrollbar";
    res.appendChild(details);
    // Tags, as before
    let tags = document.createElement("div");
    tags.className = "margin flex flex-column";
    details.appendChild(tags);
    tags.append(create_tags("Genre(s):", movie.genres));
    tags.append(create_tags("Length:", [movie.movieLength + " min"]));
    tags.append(create_tags("Actors:", movie.actors));
    // Description
    let desc = create_paragraph("Description:", movie.description);
    desc.classList.add("flex-fill");
    details.appendChild(desc);
    res.appendChild(document.createElement("hr"));
    // Form for the final submission
    let form = document.createElement("form");
    form.className = "flex flex-column gap-_5 padding1";
    res.appendChild(form);
    // The title of the form
    let form_title = document.createElement("h3");
    form_title.innerText = "Buy Tickets";
    form.appendChild(form_title);
    // The time selector and its label used to select the movie time.
    let time_container = document.createElement("div");
    form.appendChild(time_container);
    let select_time_label = document.createElement("label");
    select_time_label.htmlFor = "time";
    select_time_label.innerText = "Start Time: ";
    time_container.appendChild(select_time_label);
    let select_time = document.createElement("select");
    select_time.name = "time";
    movie.movieTimes.forEach(t => {
        let option = document.createElement("option");
        option.value = t;
        option.textContent = t;
        select_time.appendChild(option);
    });
    time_container.appendChild(select_time);
    // Ticket number input
    let ticket_num_container = document.createElement("div");
    form.appendChild(ticket_num_container);
    let input_ticket_label = document.createElement("label");
    input_ticket_label.innerText = "Number of Ticket(s): ";
    input_ticket_label.htmlFor = "ticket_num";
    ticket_num_container.appendChild(input_ticket_label);
    let input_ticket = document.createElement("input");
    input_ticket.type = "number";
    input_ticket.value = "1";
    ticket_num_container.appendChild(input_ticket);
    // User name input
    let name_container = document.createElement("div");
    form.appendChild(name_container);
    let input_name_label = document.createElement("label");
    input_name_label.innerText = "Plase Enter Your Name: ";
    input_name_label.htmlFor = "user_name";
    name_container.appendChild(input_name_label);
    let input_name = document.createElement("input");
    input_name.type = "text";
    name_container.appendChild(input_name);
    let buy = document.createElement("button");
    buy.className = "round btn padding1 nomargin color-primary color-reverse span-width center";
    buy.innerHTML = "<strong> BUY </strong>";
    buy.addEventListener("click", (e) => {
        e.preventDefault();
        const userData = {
            movie: movie, // this should be the entire "movie" object, as described in lines 17-24 above
            movieTime: select_time.value, // a string
            numberOfTickets: parseInt(input_ticket.value), // a number
            userName: input_name.value // a string
        };
        trial.submitMovieChoice(userData);
    });
    form.appendChild(buy);
    return res;
}
