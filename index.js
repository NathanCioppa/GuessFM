async function searchLastfm(inputElement) {
    try {
        const result = await fetch(`http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${inputElement.value}&api_key=0d233a8d757fa7ab78f3a5605a7567af&format=json`)
        const response = await result.json()
        console.log(response)
        loadSearchResults(response)
    } 
    catch (error) {console.log(error)}
}

async function searchMusicBrainz(query) {
    try {
        const result = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json`)
        const response = await result.json()
        const bestMatch = response.artists[0]
        let conflicts = [new MusicBrainzConflict(bestMatch)]
        
        response.artists.map(artist => {
            if(artist === bestMatch) return

            if(artist.name === bestMatch.name) conflicts.push(new MusicBrainzConflict(artist))
        })

        if(conflicts.length > 1) conflicts.map(conflict => {
            document.querySelector('#conflicts').innerHTML+=`
            <div class="conflict-item" musicbrainz-id="${conflict.id}" onclick="selectConflict(this.getAttribute('musicbrainz-id'))">
                ${conflict.description}
            </div>
        `}) 
        else getArtistAlbumDebut(response.artists[0].id)
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

        console.log(albumDebutYear)
    }
    catch (error) {console.log(error)}
}

async function loadSearchResults(results) {
    const resultsDisplay = document.querySelector("#results")
    resultsDisplay.innerHTML = ""
    
    results.results.artistmatches.artist.map(artist => {
        resultsDisplay.innerHTML+=`
        <div class="resultItem" artist-name="${artist.name}" onclick="searchMusicBrainz(this.getAttribute('artist-name'))">
        ${artist.name}
        </div>
    `})
}

class Artist {
    constructor(name, id, gender, groupSize, tags, debutAlbumYear) {

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