let list = $('.playerStatus').children();

for (let i = 0; i < list.length; i++) {
    let obj = $(list[i]);
    if (obj.children(".status").html() == "Going") {
        obj.addClass("going")
    } else {
        obj.addClass("notGoing")
    }
}