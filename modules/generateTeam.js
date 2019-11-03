const Storage = require('./storage');



let tolorance = 400;

module.exports = async function (teamID) {
    let team = await Storage.getTeamById(teamID);
    let players = await Storage.getPlayers(teamID);

    let totalPlayers = players.length;
    let team1Length = Math.round(totalPlayers / 2);

    let team1 = [];
    let team2 = [];
    players = shuffle(players);
    for (let i in players) {
        let profile = await Storage.getUserByUsername(players[i].username);
        players[i].name = `${profile.firstName} ${profile.lastName}`
        if (i < team1Length)
            team1.push(players[i]);
        else {
            team2.push(players[i]);
        }
    }

    let team1Elo = getElo(team1);
    let team2Elo = getElo(team2);

    let team1Odds = getOdds(team1Elo, team2Elo);
    let team2Odds = 1 - team1Odds;

    Storage.saveTeam(teamID, { team1, team2 });
    return;
}



function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


function getElo(team) {
    let total = 0;
    for (let i in team) {
        total += parseInt(team[i].elo);
    }
    return total / team.length;
}

function getOdds(elo1, elo2) {
    let r1 = Math.pow(10, elo1 / tolorance);
    let r2 = Math.pow(10, elo2 / tolorance);

    let totalR = r1 + r2;

    return r1 / totalR;
}