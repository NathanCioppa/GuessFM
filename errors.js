
import { hideLoadingAnimation, clearArtistSearchInput } from "./styleHelper.js"

export function alertFailToSearch() {
    hideLoadingAnimation()
    window.alert('failed search')
}

export function alertDuplicateGuess() {
    clearArtistSearchInput()
    window.alert("duplicate")
}