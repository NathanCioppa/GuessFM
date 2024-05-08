
import { Artist } from "./Artist.js"
import * as Errors from "./errors.js"
const FatalError = -1

export let topArtists = []
export let topArtistsHasLoaded = false
async function getTopArtists() {
    try{
        for(let i = 1; i <= 20; i++) {
            const topArtistsRequest = await fetch(`https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=0d233a8d757fa7ab78f3a5605a7567af&page=${i}&limit=50&format=json`)
            const topArtistsResponse = await topArtistsRequest.json()

            topArtistsResponse.artists.artist.map(artist => {
                if(topArtists.includes(artist.name)) return
                topArtists.push(artist.name)
            })
        }

        topArtistsHasLoaded = true
    } 
    catch (error) {Errors.alertFailToGetTopArtists(); console.log(error)}
}
await getTopArtists()



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
        let artistInfoRequest = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&mbid=${musicBrainzArtist.id}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
        let artistInfo = await artistInfoRequest.json()
        
        // If the is no artist listed on last.fm under the specified MusicBrainz id, a search by name will be preformed instead.
        if(artistInfo.error) {
            artistInfoRequest = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${musicBrainzArtist.name}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
            artistInfo = await artistInfoRequest.json()
        }

        artistInfo.artist.tags.tag.map(tag => {
            topTags.push(tag.name)
        })
    }
    catch(error) {console.log(error)}
    
    return topTags
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
    catch (error) {
        return FatalError
    }
}



// Searches through every release from the given artist on MusicBrainz to determine the earliest released album, their debut album.
// In some cases, mostly for new artists, no debut album will be returned because they do not have one.
function getArtistAlbumDebut(artistMusicBrainzReleaseGroups) {
    let albumDebutYear

    artistMusicBrainzReleaseGroups.map(release => {
        let isNotAlbum = 
            release["primary-type"] !== "Album" 
            || release["secondary-types"].includes("Demo") 
            || release["secondary-types"].includes("Live")

        if(isNotAlbum) return

        let releaseYear
        // Sometimes, the release date is in just 'year' format, or 'year-month-day' format. Only the year is needed.
        if(release["first-release-date"].length >= 4) releaseYear = release["first-release-date"].substring(0,4)
        if(releaseYear == null) return
                
        releaseYear = Number(releaseYear)
        if(releaseYear < albumDebutYear || albumDebutYear == null) 
            albumDebutYear = releaseYear
    })
        
    return albumDebutYear    
}



// Recursively searches through related areas until the country is found in cases where the area is not a country.
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
        const AreaRequest = await fetch(`https://musicbrainz.org/ws/2/area/${searchId}?inc=area-rels&fmt=json`)
        const Area = await AreaRequest.json()
        return await getCountry(Area)
    }
    catch(error) {console.log(error)}
    
    return null
}



// Gets a random image from an artist's release groups.
// Recursively executes until an image is successfully found, as some release groups have no image.
// Returns 'null' if no release groups have an image.
async function getArtistImageUrl(artistMusicBrainzReleaseGroups) {
    if(artistMusicBrainzReleaseGroups.length === 0) return null
    let indexToCheck = Math.floor(Math.random() * artistMusicBrainzReleaseGroups.length)

    let releaseArtRequest
    try{
        releaseArtRequest = await fetch(`https://coverartarchive.org/release-group/${artistMusicBrainzReleaseGroups[indexToCheck].id}`)
        const ReleaseArt = await releaseArtRequest.json()

        const thumbnails = ReleaseArt.images[0].thumbnails
        return thumbnails["250"] ?? thumbnails.small ?? ReleaseArt.images[0].image
    }
    catch(error) {
        if(!releaseArtRequest || releaseArtRequest.status != 404) return alertFindImageError()
        // Remove the release group that had no image, and get another random group.
        artistMusicBrainzReleaseGroups.splice(indexToCheck,1)
        return await getArtistImageUrl(artistMusicBrainzReleaseGroups)
    }
}



// Creates an Artist object that will be used in the game.
export async function constructArtistProfile(selectedArtist) {
    console.log(selectedArtist)
    let artistType
    if(selectedArtist.type === "Person") artistType = "Individual"
    if(selectedArtist.type === "Group") artistType = "Group"
    
    if(selectedArtist.gender) selectedArtist.gender = selectedArtist.gender[0].toUpperCase() + selectedArtist.gender.slice(1)

    let releaseGroups = await getArtistReleaseGroups(selectedArtist.id)
    if(releaseGroups === FatalError) return Errors.alertFailToConstructArtist()

    let rank = "<1000"
    for(let i = 1; i <= topArtists.length; i++) {
        if(topArtists[i-1].toLowerCase() == convertToSameDash(selectedArtist.name).toLowerCase()) {
            rank = i
            break
        }
    }

    let artist = new Artist(
        selectedArtist.name,
        selectedArtist.id,
        selectedArtist.gender,
        artistType,
        await getTags(selectedArtist),
        getArtistAlbumDebut(releaseGroups),
        selectedArtist.area ? await getCountry(selectedArtist.area) : null,
        await getArtistImageUrl(releaseGroups),
        rank
    )
    return artist
}

function convertToSameDash(str) {
    console.log(str)
    // Replace any dash-like characters with a standard hyphen
    // This only exists because the hyphen in blink-182 from musicBrainz did not match last.fm, I have no idea if this applies to all hyphens.
    var fixedStr = str.replace(/[-‐–—]/g, '-');
    return fixedStr;
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