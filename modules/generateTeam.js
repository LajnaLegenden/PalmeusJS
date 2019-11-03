const Storage = require('./storage');

//How much can the teams diffrer
const skillTolorance = 0.2;
const positionDiffrance = 1;
const tolorance = 150;

let team, players, totalPlayers, team1Length, team1, team2, team1Odds, team2Odds, team1Elo, team2Elo;

module.exports = async function (teamID) {
    team = await Storage.getTeamById(teamID);
    players = await Storage.getPlayers(teamID);

    totalPlayers = players.length;
    team1Length = Math.round(totalPlayers / 2);

    team1 = [];
    team2 = [];
    await generateTeam(players);

    Storage.saveTeam(teamID, { team1, team2 });
    return team1Odds;
}

async function generateTeam(players) {
    team1 = [];
    team2 = []
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

    //Show data 
    let team1Fw = 0; let team1Df = 0; let team1Gl = 0;
    let team2Fw = 0; let team2Df = 0; let team2Gl = 0;

    for (let i in team1) {
        if (team1[i].position == "FW") {
            team1Fw++;
        } else if (team1[i].position == "DF") {
            team1Df++;
        } else {
            team1Gl++;
        }
    }

    for (let i in team2) {
        if (team2[i].position == "FW") {
            team2Fw++;
        } else if (team2[i].position == "DF") {
            team2Df++;
        } else {
            team2Gl++;
        }
    }

    team1Elo = getElo(team1);
    team2Elo = getElo(team2);

    team1Odds = getOdds(team1Elo, team2Elo);
    team2Odds = 1 - team1Odds;

    if (Math.abs(team1Odds - team2Odds) < skillTolorance) {
        let invalid = true;
        if (Math.abs(team1Df - team2Df > positionDiffrance)) {
            invalid = false
        } else if (Math.abs(team1Fw - team2Fw > positionDiffrance)) {
            invalid = false
        }
        if (!invalid) {
            return await generateTeam(players);
        } else {
            return;
        }
    } else {

        return await generateTeam(players);
    }
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