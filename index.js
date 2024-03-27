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

            if(artist.name === bestMatch.name) {
                conflicts.push(new MusicBrainzConflict(artist))
            }
        })

        if(conflicts.length > 1) {conflicts.map(conflict => {
            //display html to select which data to use
        })/*;return*/}

        getArtistAlbumDebut(response.artists[0].id)

    } 
    catch (error) {console.log(error)}
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
                if(release["primary-type"] !== "Album" || release["secondary-types"].includes("Demo") || release["secondary-types"].includes("Live"))return;
                let firstReleaseDate = null
                if(release["first-release-date"].length >= 4) firstReleaseDate = release["first-release-date"].substring(0,4)
                if(firstReleaseDate == null) return
                
                
                firstReleaseDate = Number(firstReleaseDate)
                if(albumDebutYear > firstReleaseDate || albumDebutYear == null) {
                    console.log(release)
                    albumDebutYear = firstReleaseDate
                }
                    
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