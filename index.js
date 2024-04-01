
import { Artist } from "./Artist.js"
import { constructArtistProfile } from "./requests.js"



export async function searchMusicBrainz(query) {
    try {
        const Result = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`)
        const Response = await Result.json()
        displayArtistSearchResults(Response.artists)
    } 
    catch (error) {console.log(error)}
}



let currentlyDisplayedArtists = []

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

    console.log(await constructArtistProfile(selectedArtist))
}