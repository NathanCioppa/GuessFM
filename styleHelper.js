
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

export function randomizeArtistSearchPlaceholder() {
    document.querySelector('#search-artist-input').placeholder = ArtistSearchPlaceholders[Math.floor(Math.random() * ArtistSearchPlaceholders.length)]+"..."
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