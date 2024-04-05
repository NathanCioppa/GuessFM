
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


const ArtistSeatchPlaceholders = ['It must be', "Oh! I know! It's", "Maybe it's", "Obviously the answer is", 'How about', "Could it be", "What if it's"]

export function randomizeArtistSearchPlaceholder() {
    for(let i = 0; i< 100; i++) {console.log(ArtistSeatchPlaceholders[Math.floor(Math.random() * ArtistSeatchPlaceholders.length)]+"...")}
    document.querySelector('#search-artist-input').placeholder = ArtistSeatchPlaceholders[Math.floor(Math.random() * ArtistSeatchPlaceholders.length)]+"..."
}