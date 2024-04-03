
import { Artist } from "./Artist.js"
import { constructArtistProfile } from "./requests.js"
import { ArtistBlock } from "./ArtistBlock.js"

let currentlyDisplayedArtists = []
let guesses = []
let isChoosingSecret = true
let secretArtist
const MaxGuesses = 10




export function submitSearch(query) {
    if(!isChoosingSecret && checkNameMatchesSecret(query)) return winGame()
    searchMusicBrainz(query)
}

async function searchMusicBrainz(query) {
    try {
        const SearchRequest = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`)
        const SearchResults = await SearchRequest.json()
        displayArtistSearchResults(SearchResults.artists)
    } 
    catch (error) {console.log(error)}
}

function displayArtistSearchResults(artists) {
    const ResultsDisplay = document.querySelector("#artist-search-results")
    ResultsDisplay.innerHTML = ""

    currentlyDisplayedArtists = artists
    
    artists.map(artist => {
        ResultsDisplay.innerHTML+=`
        <div class="artist-search-result" artist-name="${artist.name}" artist-description="${artist.disambiguation}" musicbrainz-id="${artist.id}">
        <span class="artist-name">${artist.name}</span>
        <span class="artist-description">${artist.disambiguation ?? ' - '}</span>
        </div>
    `})
}

export async function selectArtist(artistElement) {
    let selectedArtist
    currentlyDisplayedArtists.map(displayedArtist => {
        if(displayedArtist.id === artistElement.getAttribute('musicbrainz-id')) {
            selectedArtist = displayedArtist
            return
        }
    })
    
    if(checkNameMatchesSecret(selectedArtist.name)) return winGame()

    let artist = await constructArtistProfile(selectedArtist)
    console.log(artist)

    return isChoosingSecret 
    ? setSecretArtist(artist) 
    : guessArtist(artist)
}

function setSecretArtist(artist) {
    secretArtist = artist
    isChoosingSecret = false
}

function guessArtist(artist) {
    if(checkNameMatchesSecret(artist.name)) return winGame()

    let artistBlock = new ArtistBlock(artist)
    guesses.push({artistObject: artist, artistBlock:artistBlock})
    document.querySelector('#guesses').append(artistBlock)
    
    compareToSecret(guesses[guesses.length - 1])
}

function winGame() {
    console.log('you won')
}

function loseGame() {

}

function checkNameMatchesSecret(guessName) {
    if(!secretArtist || !secretArtist.name) return false
    return guessName.toLowerCase() === secretArtist.name.toLowerCase()
}

// Responsible for assigning classes to guessed artists's attributes,
// based on whether the attribute matches or is close to the secret artists's corresponding attribute.
// ie. makes attributes green when correct, or yellow when close.
function compareToSecret(artistGuess) {
    let mainInfoAttributes = ['gender', 'type', 'debutAlbumYear', 'country']

    mainInfoAttributes.map(attributeName => {
        let artistAttributeElement = artistGuess.artistBlock.querySelector('.info .main-info .'+attributeName)
        if(artistAttributeElement && artistGuess.artistObject[attributeName] === secretArtist[attributeName])
            artistAttributeElement.classList.add('correct')
    })

    let secretTagsLowercase = []
    secretArtist.tags.map(tag => {secretTagsLowercase.push(tag.toLowerCase())})

    let guessTags = artistGuess.artistBlock.querySelectorAll('.tags .tag')

    if(guessTags) for(let i=0; i<secretTagsLowercase.length; i++) {
        guessTags.includes
    }

    if(guessTags) for(let i=0; i<guessTags.length; i++) {
        let tag = guessTags[i]
        if(secretTagsLowercase.includes(tag.innerHTML.toLowerCase())) {
            tag.classList.add('correct')
            continue
        }
        secretTagsLowercase.map(secretTag => {
            if(tag.innerHTML.toLowerCase().includes(secretTag)) tag.classList.add('close')
        })
    }
    
}