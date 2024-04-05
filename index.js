
import { Artist } from "./Artist.js"
import { constructArtistProfile } from "./requests.js"
import { ArtistBlock } from "./ArtistBlock.js"
import * as StyleHelper from "./styleHelper.js"

let currentlyDisplayedArtists = []
let guesses = []
let isChoosingSecret = true
let secretArtist
const MaxGuesses = 10




export function submitSearch(query) {
    if(!isChoosingSecret && checkNameMatchesSecret(query)) return winGame()
    if(query.trim() !== "") {
        StyleHelper.hideSearchResults()
        searchMusicBrainz(query)
    }
}

async function searchMusicBrainz(query) {
    try {
        const SearchRequest = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`)
        const SearchResults = await SearchRequest.json()
        if(SearchResults.count && SearchResults.count > 0)
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
        <span class="artist-description">${artist.disambiguation ?? '~'}</span>
        </div>
    `})

    StyleHelper.showSearchResults()
}

export async function selectArtist(artistElement) {
    let selectedArtist
    currentlyDisplayedArtists.map(displayedArtist => {
        if(displayedArtist.id === artistElement.getAttribute('musicbrainz-id')) {
            selectedArtist = displayedArtist
            return
        }
    })
    StyleHelper.hideSearchResults()
    StyleHelper.randomizeArtistSearchPlaceholder()
    if(isChoosingSecret) StyleHelper.clearArtistSearchInput()
    
    if(checkNameMatchesSecret(selectedArtist.name)) return winGame()

    let artist = await constructArtistProfile(selectedArtist)

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

    StyleHelper.clearArtistSearchInput()
    
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
    compareMainAttributesToSecret(artistGuess)
    compareTagsToSecret(artistGuess)
}

function compareMainAttributesToSecret(artistGuess) {
    const MainInfoAttributes = ['gender', 'type', 'debutAlbumYear', 'country']
    let shouldCheckDebutCloseness = true

    // Check for exact matches in main attributes
    MainInfoAttributes.map(attributeName => {
        let artistAttributeElement = artistGuess.artistBlock.querySelector('.info .main-info .'+attributeName)
        if(artistAttributeElement && artistGuess.artistObject[attributeName] === secretArtist[attributeName]) {
            artistAttributeElement.classList.add('correct')

            attributeName === 'debutAlbumYear' && (shouldCheckDebutCloseness = false)
        }
    })
    if(!shouldCheckDebutCloseness) return

    // Check for close guesses in debut album year
    // Close guesses will have css classes added to them so that they display as close and either too high or low
    // ie. close guess that is too low will be yellow with an up arrow
    const ClosenessTolerance = 10
    const GuessDebut = artistGuess.artistObject.debutAlbumYear
    let guessDebutElement = artistGuess.artistBlock.querySelector('.debutAlbumYear')
    
    const DebutCloseTooLow = GuessDebut < secretArtist.debutAlbumYear && GuessDebut >= secretArtist.debutAlbumYear - ClosenessTolerance
    if(DebutCloseTooLow) return guessDebutElement.classList.add('close', 'too-low')
        
    const DebutCloseTooHigh = GuessDebut > secretArtist.debutAlbumYear && GuessDebut <= secretArtist.debutAlbumYear + ClosenessTolerance
    if(DebutCloseTooHigh) guessDebutElement.classList.add('close', 'too-high')
}

function compareTagsToSecret(artistGuess) {
    let secretTagsLowercase = []
    secretArtist.tags.map(tag => { secretTagsLowercase.push(tag.toLowerCase())} )

    let guessTagElements = artistGuess.artistBlock.querySelectorAll('.tags .tag')
    if(!guessTagElements) return

    for(let i=0; i<guessTagElements.length; i++) {
        let tagElement = guessTagElements[i]

        if(secretTagsLowercase.includes(tagElement.innerHTML.toLowerCase())) {
            tagElement.classList.add('correct')
            continue
        }
        
        secretTagsLowercase.map(secretTag => {
            // If a guessed tag's content contains the value of any of the secret artist's tags, it will be considered close.
            // ie. guessed tag 'indie pop' will be close if the secret artist has either 'pop' or 'indie' as a tag.
            if(tagElement.innerHTML.toLowerCase().includes(secretTag)) 
                tagElement.classList.add('close')

            // If a secretTag's contents contain the value of a guessed tag, it will be considered close.
            // ie. guessed artist tag 'punk' will be close if the secret artist has the tag 'pop punk'.
            if(secretTag.includes(tagElement.innerHTML.toLowerCase()))
                tagElement.classList.add('close')
        })
    }
}