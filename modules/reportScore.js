const Storage = require('./storage')

let kFactor = 24;
let tolorance = 150;
async function report(res, teamID) {
    console.log(res);
    let unsorted = await Storage.getSquadForTeam(teamID);
    console.log(unsorted);
    let team1 = []
    let team2 = []

    for (let i in unsorted) {
        if (unsorted[i].team == 0)
            team1.push(unsorted[i]);
        else
            team2.push(unsorted[i]);
    }

    team1Elo = getElo(team1) || 1000;
    team2Elo = getElo(team2) || 1000;

    team1Odds = getOdds(team1Elo, team2Elo);
    team2Odds = 1 - team1Odds;
    console.log(team1Odds, team2Odds);

    if (res == "TEAM1") {
        let diff = 1 - team1Odds;
        for (let i in team1) {
            let elo = parseInt(team1[i].elo);
            let newElo = elo + (kFactor * diff);
            Storage.updateElo(team1[i].userID, team1[i].teamID, newElo)
        }

        diff = 0 - team2Odds;
        for (let i in team2) {
            let elo = parseInt(team2[i].elo);
            let newElo = elo + (kFactor * diff);
            console.log(newElo)
            Storage.updateElo(team2[i].userID, team2[i].teamID, newElo)
        }
        deleteTeams(teamID);
    } else if (res == "TEAM2") {
        let diff = 0 - team1Odds;
        for (let i in team1) {
            let elo = parseInt(team1[i].elo);
            let newElo = elo + (kFactor * diff);
            Storage.updateElo(team1[i].userID, team1[i].teamID, newElo)
        }

        diff = 1 - team2Odds;
        for (let i in team2) {
            let elo = parseInt(team2[i].elo);
            let newElo = elo + (kFactor * diff);
            Storage.updateElo(team2[i].userID, team2[i].teamID, newElo)

        }
        deleteTeams(teamID);
    } else {
        deleteTeams(teamID);
    }
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

async function deleteTeams(teamID) {
    await Storage.resetTeamSquad(teamID);
}

module.exports = report;