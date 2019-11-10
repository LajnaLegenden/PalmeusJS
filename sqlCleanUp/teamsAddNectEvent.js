let Storage = require('./../modules/storage');
const mysql = require("./../modules/mysql");


async function asd() {

}

function nextDay(dow, time) {
    let hr = time.substring(0, 2);
    let min = time.substring(3, 5);
    console.log(hr, min);
    let d = new Date();
    d.setDate(d.getDate() + (dow + (7 - d.getDay())) % 7);
    d.setHours(hr);
    d.setMinutes(min)
    return d;
}

asd();