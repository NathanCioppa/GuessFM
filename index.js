
import { Artist } from "./Artist.js"



export async function searchMusicBrainz(query) {
    try {
        const Result = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`)
        const Response = await Result.json()
        displayArtistSearchResults(Response.artists)
    } 
    catch (error) {console.log(error)}
}



// Returns an array of MusicBrainz release groups from an artist's MusicBrainz id.
// The returned array will contain every release group available for that artist.
async function getArtistReleaseGroups(artistMusicBrainzId) {
    let releases = []
    let releaseCount = 0
    const Limit = 100
    let timesSearched = 0
    try{
        do {
            const ReleaseGroupsRequest = await fetch(`https://musicbrainz.org/ws/2/release-group/?artist=${artistMusicBrainzId}&limit=${Limit}&offset=${Limit*timesSearched}&fmt=json`)
            const ReleaseGroups = await ReleaseGroupsRequest.json()
            
            // The response will tell the total number of releases, but will not return more than 100.
            // This can be used to figure out if all releases have been checked, or if more requests are needed. 
            releaseCount = ReleaseGroups["release-group-count"] 

            releases = releases.concat(ReleaseGroups["release-groups"])
            timesSearched++
        }
        while (timesSearched*Limit < releaseCount)

        return releases
    }
    catch (error) {console.log(error)}
}



// Searches through every release from the given artist on MusicBrainz to determine the earliest released album, their debut album.
// In some cases, mostly for new artists, no debut album will be returned because they do not have one.
function getArtistAlbumDebut(artistMusicBrainzReleaseGroups) {
    let albumDebutYear

    artistMusicBrainzReleaseGroups.map(release => {
        let releaseYear
        // Sometimes, the release date is in just 'year' format, or 'year-month-day' format. Only the year is needed.
        if(release["first-release-date"].length >= 4) releaseYear = release["first-release-date"].substring(0,4)
        if(releaseYear == null) return

        let isNotAlbum = 
            release["primary-type"] !== "Album" 
            || release["secondary-types"].includes("Demo") 
            || release["secondary-types"].includes("Live")

        if(isNotAlbum) return
                
        releaseYear = Number(releaseYear)
        if(releaseYear < albumDebutYear || albumDebutYear == null) 
            albumDebutYear = releaseYear
    })
        
    return albumDebutYear    
}



// Gets a random image from an artist's release groups.
// Recursively executes until an image is successfully found, as some release groups have no image.
// Returns 'null' if no release groups have an image.
async function getArtistImageUrl(artistMusicBrainzReleaseGroups) {
    if(artistMusicBrainzReleaseGroups.length === 0) return null
    let indexToCheck = Math.floor(Math.random() * artistMusicBrainzReleaseGroups.length)

    try{
        const Result = await fetch(`https://coverartarchive.org/release-group/${artistMusicBrainzReleaseGroups[indexToCheck].id}`)
        const Response = await Result.json()

        const thumbnails = Response.images[0].thumbnails
        return thumbnails["250"] ?? thumbnails.small ?? Response.images[0].image
    }
    catch(error) {
        // Remove the release group that had no image, and get another random group.
        artistMusicBrainzReleaseGroups.splice(indexToCheck,1)
        return await getArtistImageUrl(artistMusicBrainzReleaseGroups)
    }
}



let currentlyDisplayedArtists = []

async function displayArtistSearchResults(artists) {
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



export function selectArtist(artistElement) {
    let selectedArtist
    currentlyDisplayedArtists.map(displayedArtist => {
        if(displayedArtist.id === artistElement.getAttribute('musicbrainz-id')) {
            selectedArtist = displayedArtist
            return
        }
    })

    constructArtistProfile(selectedArtist)
}



// Gets up to 5 tags for the artist. Tags are basically genres.
async function getTags(musicBrainzArtist) {
    let tags = musicBrainzArtist.tags
    let topTags = [] // This will contain the final tags that get returned.

    const DesiredTagAmount = 5
    if(tags && tags.length >= DesiredTagAmount) {
        for(let i=0; i<DesiredTagAmount; i++) {
            topTags.push(tags[i].name)
        }
        return topTags
    }

    // If there are not 5 tags listed on the artist's MusicBrainz profile, then tags will be gotten from their Last.fm profile.
    // Last.fm never gives more than 5 tags, and rarely gives less than 5.
    try{
        let result = await fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&mbid=${musicBrainzArtist.id}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
        let response = await result.json()
        
        // If the is no artist listed on last.fm under the specified MusicBrainz id, a search by name will be preformed instead.
        if(response.error) {
            result = await fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${musicBrainzArtist.name}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
            response = await result.json()
        }

        response.artist.tags.tag.map(tag => {
            topTags.push(tag.name)
        })
    }
    catch(error) {console.log(error)}
    
    return topTags
}



// Recursively searches through related areas until the country is found in cases where the area is not a country .
async function getCountry(musicBrainzArea) {
    if(musicBrainzArea.type === "Country") return musicBrainzArea.name
    let searchId

    if(musicBrainzArea.relations) {
        let foundCountry = false
        let countryName
        musicBrainzArea.relations.map(relatedArea => {
            // "backward" direction indicates that the related area contains the current area.
            // Ex. if current area is California, the related "backward" area would be United States.
            if(relatedArea.direction === "backward") {
                searchId = relatedArea.area.id
                countryName = relatedArea.area.name
                foundCountry = relatedArea.area.type === "Country"
                return
            }
        })
        if(foundCountry) return countryName
        if(searchId == null) return
    }
    else {searchId = musicBrainzArea.id}

    try{
        const Result = await fetch(`https://musicbrainz.org/ws/2/area/${searchId}?inc=area-rels&fmt=json`)
        const Response = await Result.json()
        return await getCountry(Response)
    }
    catch(error) {console.log(error)}
    
    return null
}



// Creates the Artist object that will be used in the game.
async function constructArtistProfile(selectedArtist) {
    let artistType
    if(selectedArtist.type === "Person") artistType = "Individual"
    if(selectedArtist.type === "Group") artistType = "Group"

    let releaseGroups = await getArtistReleaseGroups(selectedArtist.id)

    let artist = new Artist(
        selectedArtist.name,
        selectedArtist.id,
        selectedArtist.gender,
        artistType,
        await getTags(selectedArtist),
        getArtistAlbumDebut(releaseGroups),
        selectedArtist.area ? await getCountry(selectedArtist.area) : null,
        await getArtistImageUrl(releaseGroups) ?? "no image"
    )

    console.log(artist)

    document.querySelector("#selected-artist").src=artist.imageUrl
}



/*
Get an artist's tags and onTour
let ARTIST_NAME = LAST_FM_SEARCH_RESULTS_OBJECT.results.artistmatches.artist[0].name
try {
    const result = await fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${ARTIST_NAME}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
    const response = await result.json()
    console.log(response)
} 
    catch (error) {console.log(error)}

async function searchLastfm(inputElement) {
    try {
        const Result = await fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${inputElement.value}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
        const Response = await Result.json()
        console.log(Response)
        loadSearchResults(Response)
    } 
    catch (error) {console.log(error)}
}
*/