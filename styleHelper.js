
const SearchResultsContainerDisplayHeight = '20rem'
const SearchResultsContainerHeightProperty = '--search-results-container-height'

export function showSearchResults() {
    document.documentElement.style.setProperty(SearchResultsContainerHeightProperty, SearchResultsContainerDisplayHeight)
}

export function hideSearchResults(){
    document.documentElement.style.setProperty(SearchResultsContainerHeightProperty, '0')
}





export function clearArtistSearchInput() {
    document.querySelector('#search-artist-input').value = ""
}


const ArtistSearchPlaceholders = ['It must be', "Oh! I know! It's", "Maybe it's", "Obviously the answer is", 'How about', "Could it be", "What if it's"]
const ChooseSecretSearchPlaceholder = "Search for an artist to guess"

export function randomizeArtistSearchPlaceholder() {
    document.querySelector('#search-artist-input').placeholder = ArtistSearchPlaceholders[Math.floor(Math.random() * ArtistSearchPlaceholders.length)]+"..."
}

export function resetSearchPlaceholder() {
    document.querySelector('#search-artist-input').placeholder = ChooseSecretSearchPlaceholder
}





export function showLoadingAnimation() {
    document.querySelector("#loading-animation").style.opacity = '1'
}

export function hideLoadingAnimation() {
    document.querySelector("#loading-animation").style.opacity = '0'
}





export function showGuessCount() {
    document.querySelector('#guess-count-display').style.opacity = 1
}

export function hideGuessCount() {
    document.querySelector('#guess-count-display').style.opacity = 0
}





export function hideErrorMessage() {
    document.documentElement.style.setProperty("--error-message-display", "none")
}





export function showEndScreen() {
    document.documentElement.style.setProperty("--end-screen-display", "flex")
    document.documentElement.style.setProperty("--end-screen-animation", "show-end-screen 0.75s forwards")
}

export function hideEndScreen() {
    document.documentElement.style.setProperty("--end-screen-animation", "hide-end-screen 0.5s forwards")
}




export function setRandomGuessBtnActive() {
    document.documentElement.style.setProperty("--random-guess-bg", "rgb(140, 46, 163)")
}

export function hideRandomGuessBtn() {
    document.documentElement.style.setProperty("--random-guess-scale", "0")
}

export function showRandomGuessBtn() {
    document.documentElement.style.setProperty("--random-guess-scale", "1")
}