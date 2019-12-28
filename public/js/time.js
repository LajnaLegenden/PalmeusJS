
function doTimeCalc() {
    let ms = time - new Date();
    let sec = ms /= 1000;
    let min = sec / 60;
    let hrs = min / 60
    let displayMin = Math.floor(min % 60);
    let displayHr = Math.floor((min - displayMin) / 60)
    let displaySec = Math.floor(sec % 60)
    if (displaySec < 10)
        displaySec = "0" + displaySec
    if (displayMin < 10)
        displayMin = "0" + displayMin
    if (displayHr < 10)
        displayHr = "0" + displayHr
    $('#countDown').html(displayHr + ":" + displayMin + ":" + displaySec);
}

setInterval(doTimeCalc, 1000)