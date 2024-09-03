const version = 'en-kjv';
let verse_on;
let chapter_on;
let book;
let nice_book_name;
let verses_taken = [];

let body  = document.body;
let input = document.getElementById("text_input");
let autocomplete = document.getElementById("autocomplete");
let guesses_left = 5;

function clear_verses() {
    let verses;
    while ((verses = document.getElementsByClassName("verse")).length != 0) {
        verses[0].remove();
    }
}

function make_verse_tag(text) {
    let tag = document.createElement("p");
    tag.textContent = text;
    tag.classList.add("verse");
    return tag;
}

function rand_range(a, b) {
    return Math.floor(a + ((b + 1) - a) * Math.random() * 0.99999);
}

function get_chapter(book, chapter) {
    let url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${version}/books/${book}/chapters/${chapter}.json`;

    return fetch(url)
    .then(response => {
        if (!response.ok)
            throw new Error(`Womp womp 1 ${response.status}`);

        return response.json();
    })
    .then(data => {
        return data.data;
    })
    .catch(error => {
        console.error('Womp womp 2', error);
    });
}

function remove_annotation(text, chapter, verse) {
    let anno = `${chapter}.${verse}`;
    let anno_start = text.indexOf(anno);

    if (anno_start !== -1) {
        text = text.substring(0, anno_start);
    }
    return text;
}

function rand_verse() {
    clear_verses();
    verses_taken = [];
    guesses_left = 5;

    let book_id = rand_range(0, Object.keys(book_registry).length - 1);
    book = Object.keys(book_registry)[book_id];
    let chapter_id = rand_range(1, book_registry[book]);

    get_chapter(book, chapter_id)
    .then(chapter => {
        let verse_id = rand_range(0, chapter.length-1);
        let text = chapter[verse_id].text;
        text = remove_annotation(text, chapter[verse_id].chapter, chapter[verse_id].verse);
        
        verse_on = chapter[verse_id].verse;
        chapter_on = chapter[verse_id].chapter;
        nice_book_name = chapter[verse_id].book;
    
        verses_taken.push(Number(verse_on));

        let verse_tag = make_verse_tag(text)
        body.appendChild(verse_tag);
    });
}

function reveal_neighbour() {
    console.log(verses_taken);

    get_chapter(book, chapter_on)
    .then(chapter => {

        let dir = Math.random() > 0.5 ? -1 : 1;
        let new_verse = verses_taken[rand_range(0, verses_taken.length-1)] + dir;
        while ((verses_taken.includes(new_verse)) ||
            (new_verse === 0 || new_verse === chapter.length)) {
            
            dir = Math.random() > 0.5 ? -1 : 1;
            new_verse = verses_taken[rand_range(0, verses_taken.length-1)] + dir;
        }

        console.log("dir: ", dir);

        console.log(book, chapter_on, new_verse);
        verses_taken.push(new_verse);
        let text = chapter[new_verse-1].text;
        text = remove_annotation(text, chapter[new_verse-1].chapter, chapter[new_verse-1].verse);
        let verse_tag = make_verse_tag(text);
        
        if (dir == -1) {
            body.insertBefore(verse_tag, body.children[1]);
        } else {
            body.appendChild(verse_tag);
        }
    });
}

function clear_autocomplete() {
    while (autocomplete.firstChild) {
        autocomplete.removeChild(autocomplete.firstChild);
    }
}

function make_guess(guess) {
    guesses_left--;

    guess = guess.toLowerCase();
    guess = guess.replace(" ", "");
    console.log(book, guess);

    let correct = guess === book;

    if (correct) {
        alert(`You guessed correctly, the was ${nice_book_name}!`);
        rand_verse();
    } else {
        if (guesses_left != 0)
            reveal_neighbour();
        else {
            alert(`The book was ${nice_book_name} :(`);
            rand_verse();
        }
    }
}

function process_autocomplete(event) {
    clear_autocomplete();
    if (input.value == "")
        return;
    
    for (let book_name of nice_book_names) {
        if (book_name.toLowerCase().startsWith(input.value.toLowerCase())) {
            let suggestion = document.createElement("p");
            suggestion.classList.add("suggestion");
    
            suggestion.onmousedown = function() {
                input.value = suggestion.textContent;
                make_guess(input.value);
            };
    
            suggestion.textContent = book_name;
            autocomplete.appendChild(suggestion);
        }
    }

    if (event.key === 'Enter' || event.keyCode === 13) {
        let suggestions = document.getElementsByClassName("suggestion");
        if (suggestions.length == 0) {
            alert("Not a book in the Bible.");
            return;
        }
        input.value = suggestions[0].textContent;
        make_guess(input.value);
        return;
    }
}

input.addEventListener("keyup", process_autocomplete);
input.addEventListener("focusin", process_autocomplete);

input.addEventListener("focusout", event => {
    setTimeout(function() {clear_autocomplete();}, 10);
});

document.getElementById("input_form").addEventListener("submit", event => {
    event.preventDefault();
});

document.addEventListener("DOMContentLoaded", event => {
    rand_verse();
});