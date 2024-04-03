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
            this.country = artist.country
            this.imageUrl = artist.imageUrl
        }

        ArtistBlock.innerContent = this.innerHTML
    }

    static innerContent

    connectedCallback() {
        this.render();
    }

    render() {
        const Name = this.name
        const Gender = this.gender
        const Type = this.type
        const Tags = this.tags || []
        const DebutAlbumYear = this.debutAlbumYear || "No Debut Album!"
        const Country = this.country
        const ImageUrl = this.imageUrl

        this.innerHTML = `
        <div class="name">
            <div class="artist-img-container">
                <img class="artist-img" src="${ImageUrl}" alt="">
            </div>
            ${Name}
        </div>
        <div class="info">
            <div class="main-info">
                ${Gender ? `<div class="gender attribute"><span class="label">Gender:</span> <span class="value">${Gender}</span></div>` :''}
                ${Type ? `<div class="type attribute"><span class="label">Type:</span> <span class="value">${Type}</span></div>` : ''}

                <div class="debutAlbumYear attribute"><span class="label">Debut Album:</span> <span class="value">${DebutAlbumYear}&nbsp;<span class="arrow">></span></span></div>
                ${Country ? `<div class="country attribute"><span class="label">Country:</span> <span class="value">${Country}</span></div>` : ''}
            </div>
            <div class="tags">
            ${Tags.map(tag => {
                let tagElement = `<div class="tag attribute">${tag}</div>`
                return tagElement
            }).join('')}
            </div>
        </div> 
        `
    }
}

customElements.define('artist-block', ArtistBlock);