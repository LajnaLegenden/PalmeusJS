const Storage = require('./storage');

//How much can the teams diffrer
let skillTolorance = 0.2;
let positionDiffrance = 1;
const tolorance = 150;
const debug = true;

let players, totalPlayers, team1Length, team1, team2, team1Odds, team2Odds, team1Elo, team2Elo;

module.exports = async function (teamID) {

    if (debug) {
        players = await Storage.getPlayers(teamID);
    } else {
        players = await Storage.getAllGoingPlayers(teamID);
        console.log("players", players)
        for (let i in players) {
            console.log(players[i])
            players[i] = await Storage.getTeamDataForPlayer(teamID, players[i].userID);
        }
    }


    totalPlayers = players.length;
    team1Length = Math.round(totalPlayers / 2);

    team1 = [];
    team2 = [];
    try {
        console.log(30, players)
        await generateTeam(players);
        await Storage.saveTeam(teamID, { team1, team2 });

    } catch (error) {
        return error
    }
    return team1Odds;
}

async function generateTeam(players) {
    try {
        team1 = [];
        team2 = []
        console.log(42, players)
        players = shuffle(players);
        console.log(44, players)
        for (let i in players) {
            console.log(players[i]);
            let profile = await Storage.getUserByID(players[i].userID);
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

        team1Elo = getElo(team1) || 1000;
        team2Elo = getElo(team2) || 1000;

        team1Odds = getOdds(team1Elo, team2Elo);
        team2Odds = 1 - team1Odds;

        if (Math.abs(team1Odds - team2Odds) < skillTolorance) {
            let invalid = true;
            if (Math.abs(team1Df - team2Df > positionDiffrance)) {
                invalid = false;
                positionDiffrance += 0.1
            } else if (Math.abs(team1Fw - team2Fw > positionDiffrance)) {
                invalid = false;
                positionDiffrance += 0.1
            } else if (Math.abs(team1Gl - team2Gl > 0)) {
                invalid = false;
            }
            if (!invalid) {
                return await generateTeam(players);
            } else {
                return;
            }
        } else {
            skillTolorance += 0.01;
            return await generateTeam(players);
        }
    } catch (error) {
        console.log(err)
        throw error
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