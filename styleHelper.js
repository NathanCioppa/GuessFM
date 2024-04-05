
const SearchResultsContainerDisplayHeight = '20rem'
const SearchResultsContainerHeightProperty = '--search-results-container-height'

export function showSearchResults() {
    document.documentElement.style.setProperty(SearchResultsContainerHeightProperty, SearchResultsContainerDisplayHeight)
}
export function hideSearchResults(){
    document.documentElement.style.setProperty(SearchResultsContainerHeightProperty, '0')
}