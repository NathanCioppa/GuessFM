async function searchLastfm(inputElement) {
    try {
        const result = await fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${inputElement.value}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
        const response = await result.json()
        console.log(response)
        loadSearchResults(response)
    } 
    catch (error) {console.log(error)}
}

export async function searchMusicBrainz(query) {
    try {
        const result = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`)
        const response = await result.json()

        displayArtistSearchResults(response.artists)

        //const bestMatch = response.artists[0]
        //let conflicts = [new MusicBrainzConflict(bestMatch)]
        

        //response.artists.map(artist => {
        //    if(artist === bestMatch) return
//
        //    if(artist.name === bestMatch.name) conflicts.push(new MusicBrainzConflict(artist))
        //})
//
        //if(conflicts.length > 1) conflicts.map(conflict => {
        //    document.querySelector('#conflicts').innerHTML+=`
        //    <div class="conflict-item" musicbrainz-id="${conflict.id}" onclick="selectConflict(this.getAttribute('musicbrainz-id'))">
        //        ${conflict.description}
        //    </div>
        //`}) 
        //else 
        //getArtistAlbumDebut(response.artists[0].id)
    } 
    catch (error) {console.log(error)}
}

function selectConflict(id) {
    document.querySelector('#conflicts').innerHTML = ''
    getArtistAlbumDebut(id)
    
}

async function getArtistAlbumDebut(musicBrainzId) {
    let albumDebutYear = null
    let releaseCount = 0
    const limit = 100
    let i = 0
    try{
        do{
            const result = await fetch(`https://musicbrainz.org/ws/2/release-group/?artist=${musicBrainzId}&limit=${limit}&offset=${limit*i}&fmt=json`)
            const response = await result.json()

            releaseCount = response["release-group-count"]

            response["release-groups"].map(release => {
                let isNotAlbum = 
                    release["primary-type"] !== "Album" 
                    || release["secondary-types"].includes("Demo") 
                    || release["secondary-types"].includes("Live")

                if(isNotAlbum)return;
                
                let releaseYear = null
                if(release["first-release-date"].length >= 4) releaseYear = release["first-release-date"].substring(0,4)
                if(releaseYear == null) return
                
                releaseYear = Number(releaseYear)
                if(albumDebutYear > releaseYear || albumDebutYear == null) 
                    albumDebutYear = releaseYear
            })
            i++
        } 
        while ((i*limit) < releaseCount)

        return albumDebutYear
    }
    catch (error) {console.log(error)}
}

let currentlyDisplayedArtists = []
async function displayArtistSearchResults(artists) {
    const resultsDisplay = document.querySelector("#artist-search-results")
    resultsDisplay.innerHTML = ""

    currentlyDisplayedArtists = artists
    
    artists.map(artist => {
        resultsDisplay.innerHTML+=`
        <div class="artist-search-result" artist-name="${artist.name}" artist-description="${artist.disambiguation}" musicbrainz-id="${artist.id}">
        <span class="artist-name">${artist.name}</span>
        <span class="artist-description">${artist.disambiguation ?? ' - '}</span>
        </div>
    `})
}

export function selectArtist(artistElement) {
    let selectedArtist = null
    currentlyDisplayedArtists.map(displayedArtist => {
        if(displayedArtist.id === artistElement.getAttribute('musicbrainz-id')) {
            selectedArtist = displayedArtist
            return
        }
    })

    constructArtistProfile(selectedArtist)
}

async function getTags(musicBrainzArtist) {
    let tags = musicBrainzArtist.tags
    let topTags = []
    console.log(musicBrainzArtist)

    const desiredTagAmount = 5
    if(tags && tags.length >=desiredTagAmount) {
        for(let i=0; i<desiredTagAmount; i++) {
            topTags.push(tags[i].name)
        }
        return topTags
    }

    try{
        let result = await fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&mbid=${musicBrainzArtist.id}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
        let response = await result.json()
        
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

async function getCountry(musicBrainzArea) {
    if(musicBrainzArea.type === "Country") return musicBrainzArea.name
    let searchId

    if(musicBrainzArea.relations){
        let foundCountry = false
        let countryName
        musicBrainzArea.relations.map(relatedArea => {
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
        const result = await fetch(`https://musicbrainz.org/ws/2/area/${searchId}?inc=area-rels&fmt=json`)
        const response = await result.json()
        return await getCountry(response)
    }
    catch(error) {console.log(error)}
    
    return null
}


async function constructArtistProfile(selectedArtist) {

    let artistType
    if(selectedArtist.type === "Person") artistType = "Individual"
    if(selectedArtist.type === "Group") artistType = "Group"
    
    let artist = new Artist(
        selectedArtist.name,
        selectedArtist.id,
        selectedArtist.gender,
        artistType,
        await getTags(selectedArtist),
        await getArtistAlbumDebut(selectedArtist.id),
        selectedArtist.area.type === "Country" ? selectedArtist.area.name : await getCountry(selectedArtist.area)
    )

    console.log(artist)
}

class Artist {
    constructor(name, id, gender, type, tags, debutAlbumYear, area) {
        this.name = name
        this.id = id
        this.gender = gender
        this.type = type
        this.tags = tags
        this.debutAlbumYear = debutAlbumYear
        this.area = area
    }
}

class MusicBrainzConflict {
    constructor(musicBrainzArtistJson) {
        this.description = musicBrainzArtistJson.disambiguation
        this.id = musicBrainzArtistJson.id
    }
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
*/