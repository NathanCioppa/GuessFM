import { Artist } from "./Artist.js" 

export class ArtistBlock extends HTMLElement {
    constructor(artist){
        super()

        if(artist instanceof (Artist)) {
            this.name = artist.name
            this.gender = artist.gender
            this.type = artist.type
            this.tags = artist.tags
            this.debutAlbumYear = artist.debutAlbumYear
            this.country = artist.area
            this.imageUrl = artist.imageUrl
        }

        ArtistBlock.innerContent = this.innerHTML
    }

    static innerContent

    connectedCallback() {
        this.render();
    }

    render() {
        //const NA = "Not Available"
        const Name = this.name// || NA
        const Gender = this.gender// || NA
        const Type = this.type// || NA
        const Tags = this.tags// || NA
        const DebutAlbumYear = this.debutAlbumYear || "No Debut Album!"
        const Country = this.country// || NA
        const ImageUrl = this.imageUrl// || NA

        this.innerHTML = `
        
            ${Name ? `<span>Name: ${Name}</span>` : ''}
            ${Gender ? `<span>Gender: ${Gender}</span>` :''}
            ${Type ? `<span>Type: ${Type}</span>`: ''}
            ${Tags ? `<div>Tags: ${Tags.map(tag => {return tag})}</div>` : ''}
            <span>Debut Album Release Year: ${DebutAlbumYear}</span>
            ${Country ? `<span>Country: ${Country}</span>` : ''}
            ${ImageUrl ? `<span>${ImageUrl}</span>` : ''}
        
        `
    }
}

customElements.define('artist-block', ArtistBlock);