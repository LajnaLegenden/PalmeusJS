let allBtn = $('.statusChange');

allBtn.each((i) => {
    if (allBtn[i].innerHTML == "Going") {
        $(allBtn[i]).addClass('btn-success')
    } else {
        $(allBtn[i]).addClass('btn-warning')
    }
    $(allBtn[i]).on('click', (e) => {
        let action = "";
        if (e.currentTarget.innerHTML == "Not Going") {
            action = "Going";
        } else {
            action = "Not Going";
        }//asd

        $.ajax({
            url: "/team/" + e.currentTarget.id + '/changeStatus',
            data: { status: action },
            method: "POST"
        }).done(function (res) {
            $('#' + res.teamID).html(res.response);
            let goingIndicatior = document.getElementById('going' + res.teamID);
            let numGoing = 0;

            if ($('#' + res.teamID)[0].innerHTML == "Not Going") {
                $('#' + res.teamID).addClass('btn-warning');
                $('#' + res.teamID).removeClass('btn-success');
                numGoing--;
            } else {
                $('#' + res.teamID).removeClass('btn-warning');
                $('#' + res.teamID).addClass('btn-success');
                numGoing++;
            }


            if ($('#going' + res.teamID).length > 0) {
                console.log("got here")
                numGoing += parseInt(goingIndicatior.innerHTML)
                goingIndicatior.innerHTML = numGoing;
            }

        });
    });
});