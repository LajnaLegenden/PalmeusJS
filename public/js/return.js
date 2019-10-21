$(document).ready(() => {
    var urlPars = new URLSearchPars(window.location.search);
    console.log("asd", urlPars);
    let returnUrl = urlPars.get('returnUrl');
    if (!returnUrl) {
        returnUrl = "/"
    }
    $('#returnUrl').val(returnUrl);
});