
import { hideLoadingAnimation, clearArtistSearchInput } from "./styleHelper.js"

function showErrorMessage() {
    document.documentElement.style.setProperty("--error-message-display", "fit-content")
}

export function alertFailToSearch() {
    hideLoadingAnimation()
    document.querySelector("#error-message").innerHTML = "Failed to search. This could be due to: <br> Spelling mistake, <br> Internet connection, <br> No matchers for the searched term"
    showErrorMessage()
}

export function alertDuplicateGuess() {
    clearArtistSearchInput()
    document.querySelector("#error-message").innerHTML = "You have already made that guess."
    showErrorMessage()
}

export function alertFindImageError() {
    document.querySelector("#error-message").innerHTML = "An unexpected error occurred when searching for an artist image."
    showErrorMessage()
}

export function alertFailToConstructArtist() {
    document.querySelector("#error-message").innerHTML = "Failed to retrieve all necessary artist info. Wait a moment and try again. "
    showErrorMessage()
}