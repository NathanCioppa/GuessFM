
import { Artist } from "./Artist.js"
import { constructArtistProfile ,topArtistsHasLoaded } from "./requests.js"
import { ArtistBlock } from "./ArtistBlock.js"
import * as StyleHelper from "./styleHelper.js"
import * as Errors from "./errors.js"

let currentlyDisplayedArtists = []
let guesses = []
let isChoosingSecret = true
let secretArtist
const MaxGuesses = 10
document.querySelector('#max-guesses').innerHTML = MaxGuesses



export function submitSearch(query) {
    if(!topArtistsHasLoaded) return Errors.alertTopArtistsNotLoaded()
    if(!isChoosingSecret && checkNameMatchesSecret(query)) return endGame(true)
    if(query.trim() !== "") {
        StyleHelper.hideSearchResults()
        searchMusicBrainz(query)
    }
}

async function searchMusicBrainz(query) {
    StyleHelper.hideErrorMessage()
    StyleHelper.showLoadingAnimation()
    try {    
        const SearchRequest = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`)
        const SearchResults = await SearchRequest.json()

        if(SearchResults.count && SearchResults.count > 0)
            return displayArtistSearchResults(SearchResults.artists)
        
        Errors.alertFailToSearch()
    } 
    catch (error) {Errors.alertFailToSearch(); console.log(error)}
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

    StyleHelper.hideLoadingAnimation()
    StyleHelper.showSearchResults()
}



export async function selectArtist(artistElement) {
    let selectedArtist
    // Find the artist from the selected element in the array of displayed artists.
    currentlyDisplayedArtists.map(displayedArtist => {
        if(displayedArtist.id === artistElement.getAttribute('musicbrainz-id')) {
            selectedArtist = displayedArtist
            return
        }
    })
    StyleHelper.hideSearchResults()
    StyleHelper.randomizeArtistSearchPlaceholder()
    if(isChoosingSecret) StyleHelper.clearArtistSearchInput()
    
    for(let i=0; i<guesses.length; i++) {
        if(guesses[i].artistObject.id === selectedArtist.id) 
            return Errors.alertDuplicateGuess()
    }
    if(checkNameMatchesSecret(selectedArtist.name)) return endGame(true)

    StyleHelper.showLoadingAnimation()
    let artist = await constructArtistProfile(selectedArtist)
    StyleHelper.hideLoadingAnimation()

    if(artist instanceof Artist)
        return isChoosingSecret 
        ? setSecretArtist(artist)
        : guessArtist(artist)
}

function setSecretArtist(artist) {
    secretArtist = artist
    isChoosingSecret = false
    StyleHelper.showGuessCount()
}

function guessArtist(artist) {
    if(checkNameMatchesSecret(artist.name)) return endGame(true)

    let artistBlock = new ArtistBlock(artist)
    guesses.push({artistObject: artist, artistBlock: artistBlock})
    document.querySelector('#guesses').append(artistBlock)

    StyleHelper.clearArtistSearchInput()
    
    compareToSecret(guesses[guesses.length - 1])
    
    if(guesses.length >= MaxGuesses) return endGame(false)
    document.querySelector('#guess-count').innerHTML = guesses.length+1
}

function checkNameMatchesSecret(guessName) {
    if(!secretArtist || !secretArtist.name) return false
    return guessName.toLowerCase() === secretArtist.name.toLowerCase()
}



function endGame(didWin) {
    document.querySelector("#end-card-title").innerHTML = didWin ? "You Won!" : "<i>It was...</i>"
    document.querySelector("#end-card-artist-container").innerHTML = ""

    let secretArtistBlock = new ArtistBlock(secretArtist)
        secretArtistBlock.style.animation = "none"
        secretArtistBlock.style.scale = 1
        secretArtistBlock.style.backgroundColor = "transparent"
    
    document.querySelector("#end-card-artist-container").append(secretArtistBlock)
    StyleHelper.showEndScreen()

    if(didWin) compareToSecret({artistObject: secretArtist, artistBlock: secretArtistBlock})
}



function compareToSecret(artistGuess) {
    compareMainAttributesToSecret(artistGuess)
    compareTagsToSecret(artistGuess)
}

// Responsible for assigning classes to guessed artists's attributes,
// based on whether the attribute matches or is close to the secret artists's corresponding attribute.
// ie. makes attributes green when correct, or yellow when close.

function compareMainAttributesToSecret(artistGuess) {
    const MainInfoAttributes = ['gender', 'type', 'country']

    checkRankCloseness(artistGuess.artistObject, artistGuess.artistBlock)

    checkDebutAlbumCloseness(artistGuess.artistObject, artistGuess.artistBlock)

    // Check for exact matches in main attributes
    MainInfoAttributes.map(attributeName => {
        let artistAttributeElement = artistGuess.artistBlock.querySelector('.info .main-info .'+attributeName)
        if(artistAttributeElement && artistGuess.artistObject[attributeName] === secretArtist[attributeName]) {
            artistAttributeElement.classList.add('correct')

            attributeName === 'debutAlbumYear' && (shouldCheckDebutCloseness = false)
        }
    })
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

// Checks the rank of the Artist passed as the 'artist' argument against the current secret artist,
// then updates the ArtistBlock passed as the 'artistBlock' argument to display how close the guess is. 
// 'artistBlock' should be the ArtistBlock that corresponds to the Artist passed as 'artist'
function checkRankCloseness(artist, artistBlock) {
    const ClosenessTolerance = 50
    const Difference = (artist.rank === "<1000" ? 1001 : artist.rank) - (secretArtist.rank === "<1000" ? 1001 : secretArtist.rank)

    if(Difference === 0) return artistBlock.querySelector('.rank').classList.add('correct')

    if(Difference > 0) artistBlock.querySelector('.rank').classList.add('too-low')
    if(Difference < 0) artistBlock.querySelector('.rank').classList.add('too-high')

    if(Math.abs(Difference) <= ClosenessTolerance) artistBlock.querySelector('.rank').classList.add('close')
}

// Checks the debut album year of the Artist passed as the 'artist' argument against the current secret artist,
// then updates the ArtistBlock passed as the 'artistBlock' argument to display how close the guess is. 
// 'artistBlock' should be the ArtistBlock that corresponds to the Artist passed as 'artist'
function checkDebutAlbumCloseness(artist, artistBlock) {
    if(artist.debutAlbumYear == null || secretArtist.debutAlbumYear == null) return
    if(artist.debutAlbumYear === secretArtist.debutAlbumYear) return artistBlock.querySelector('.debutAlbumYear').classList.add('correct')
    
    const ClosenessTolerance = 10
    const Difference = artist.debutAlbumYear - secretArtist.debutAlbumYear

    if(Difference < 0) artistBlock.querySelector('.debutAlbumYear').classList.add('too-low')
    if(Difference > 0) artistBlock.querySelector('.debutAlbumYear').classList.add('too-high')

    if(Math.abs(Difference) <= ClosenessTolerance) artistBlock.querySelector('.debutAlbumYear').classList.add('close')
}

export function resetGame() {
    currentlyDisplayedArtists = []
    guesses = []
    document.querySelector('#guesses').innerHTML = ""
    document.querySelector("#search-artist-input").value = ""

    isChoosingSecret = true
    secretArtist = undefined

    StyleHelper.hideGuessCount()
    StyleHelper.resetSearchPlaceholder()
    
    StyleHelper.hideEndScreen()
}