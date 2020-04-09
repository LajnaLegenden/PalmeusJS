$(function () {
    $('[data-toggle="tooltip"]').tooltip()
    addAdminEvents();
    addTeamManagerEvents();
    addDeleteEvents();
    addEditEvents();
})

function addAdminEvents() {
    let btn = $('.adminCheck')
    for (let b of btn) {
        $(b).on("click", function (e) {
            let val = this.checked;
            $.ajax({
                url: "/user/" + e.currentTarget.id + '/setAdmin',
                data: { val },
                method: "POST"
            })
        });
    }
}
function addTeamManagerEvents() {
    let btn = $('.teamManagerCheck')
    for (let b of btn) {
        $(b).on("click", function (e) {
            let val = this.checked;
            $.ajax({
                url: "/user/" + e.currentTarget.id + '/setTeamManager',
                data: { val },
                method: "POST"
            })
        });
    }
}

function addDeleteEvents() {
    let btn = $('.deleteUser')
    for (let b of btn) {
        $(b).on("click", function (e) {
            $('#deleteUserId').val(e.target.dataset.id);
        });
    }
}


function addEditEvents() {

};