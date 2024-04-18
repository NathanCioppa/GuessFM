
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