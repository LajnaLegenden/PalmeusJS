
const mysql = require("./mysql");
const bcrypt = require('bcryptjs');

const getAllUsers = 'SELECT * FROM users';
const createNewUser = `INSERT INTO users (firstName,lastName,username,email,password,id) VALUES (?,?,?,?,?,?)`;
const verifyUsername = `SELECT * FROM users WHERE username = ?`;
const getUserByID = `SELECT * FROM users WHERE id = ?`;
const getManagedTeamsByUsername = `SELECT * FROM teams WHERE creator = ?`;
const getTeamsByUsername = `SELECT * FROM members WHERE username = ?`;

//Team
const addTeam = `INSERT INTO teams (name,id,description,location,time,dayOfTheWeek,creator,priceSingle,priceWhole,maxplayers) VALUES (?,?,?,?,?,?,?,?,?,?)`
const addAdmin = `INSERT INTO admin (teamID,username,addedBy) VALUES (?,?,?)`
const verifyAdmin = `SELECT * FROM admin WHERE username = ? AND teamID = ?`;
const getTeamByID = `SELECT * FROM teams WHERE id = ?`;
const isRealUsername = `SELECT username FROM users WHERE username = ?`;
const isTokenValid = `SELECT * FROM invite WHERE id = ?`;
const addEmailInvite = `INSERT INTO invite (toEmailOrUsername,elo,position,id,fromUser,team,typeOfInvite) VALUES (?,?,?,?,?,?,?)`
const addUsernameInvite = `INSERT INTO invite (toEmailOrUsername,elo,position,id,fromUser,team,typeOfInvite) VALUES (?,?,?,?,?,?,?)`
const joinTeam = `INSERT INTO members (username,teamID,elo,priority,attendance,position) VALUES (?,?,?,?,?,?)`
const getInvite = `SELECT * FROM invite WHERE id = ?`;
const getTeamInvitesForUser = `SELECT * FROM invite where toEmailOrUsername = ? and typeOfInvite = "USERNAME"`
const removeInvite = `DELETE FROM invite WHERE id = ?`;
const getPlayers = `SELECT * FROM members where teamID = ?`
const getUserByEmail = `SELECT * FROM users WHERE email = ?`;
const addToSquad = `INSERT INTO squad (playerUsername,team,teamID) VALUES (?,?,?)`;
const getSquadForTeam = `SELECT * FROM squad WHERE teamID = ?`;
const getTeamDataForPlayer = `SELECT * FROM members where teamID = ? AND username = ?`;
const deleteSquad = `DELETE FROM squad WHERE teamID = ?`;



class Database {
    //User functions
    async getUserByUsername(username) {
        let res = await mysql.queryP(verifyUsername, username);

        return res[0];
    }

    async createNewUser(username, password, firstName, lastName, email) {
        let id = getNewId();
        let pass = await bcrypt.hash(password, 10);
        await mysql.queryP(createNewUser, [firstName, lastName, username, email, pass, id]);
        return id;
    }
    async verifyUser(username, password) {
        let user = (await this.getUserByUsername(username));
        if (user)
            return bcrypt.compare(password, user.password);
        else
            return false;
    }

    async createTeam(nameOfEvent, description, location, timeOfDay, dayOfWeek, admin, priceSingle, priceMultiple, maxplayers) {
        let id = getNewId();
        await mysql.queryP(addTeam, [nameOfEvent, id, description, location, timeOfDay, dayOfWeek, admin, priceSingle, priceMultiple, maxplayers]);
        await mysql.queryP(addAdmin, [id, admin, admin]);
        this.joinTeam(admin, id, 1000, true, "FW");
        return "OK";
    }

    async joinTeam(user, teamId, elo, priority, pos) {
        await mysql.queryP(joinTeam, [user, teamId, elo, priority, 0, pos]);
    }

    async verifyID(id) {
        return !mysql.queryP(getUserByID, id) && !mysql.queryP(getTeamByID, id);
    }

    async getManagedTeamsByUsername(username) {
        return mysql.queryP(getManagedTeamsByUsername, username);
    }

    async getTeamsByUsername(username) {
        let teams = await mysql.queryP(getTeamsByUsername, username);
        let out = [];
        for (let i in teams) {
            let team = await this.getTeamById(teams[i].teamID);
            out.push(team);
        }
        return out;
    }

    async verifyAdmin(id, username) {
        return await mysql.queryP(verifyAdmin, [username, id]);
    }

    async getTeamById(id) {
        return (await mysql.queryP(getTeamByID, id))[0];
    }

    async isRealUsername(username) {
        return (await mysql.queryP(isRealUsername, username)).length ? true : false;
    }
    async inviteByUsername(username, elo, pos, from, team, token) {
        let stmt = await mysql.queryP(addUsernameInvite, [username, elo, pos, token, from, team, "USERNAME"]);
    }

    async inviteByEmail(email, elo, pos, from, team) {
        let token = await getToken();
        await mysql.queryP(addEmailInvite, [email, elo, pos, token, from, team, "EMAIL"]);
        return token;
    }

    async getTeamInvitesForUser(username) {
        let teams = await mysql.queryP(getTeamInvitesForUser, username);
        for (let i in teams) {
            let teamData = (await mysql.queryP(getTeamByID, teams[i].team))[0]
            teams[i].teamData = teamData;
        }
        return teams;
    }

    async respondToInvite(id, answer, user) {
        let invite = (await this.getInvite(id))[0];
        if (answer.length == 4) {
            this.joinTeam(user, invite.team, invite.elo, false, invite.position);
            await mysql.queryP(removeInvite, id);
        } else {
            await mysql.queryP(removeInvite, id);
        }
    }
    async getUserByEmail(email) {
        return await mysql.queryP(getUserByEmail, email);
    }

    async getPlayers(id) {
        return await mysql.queryP(getPlayers, id);
    }
    async getInvite(id) {
        return await mysql.queryP(getInvite, id);
    }

    async isTokenValid(token) {
        return await !mysql.queryP(isTokenValid, token);
    }

    async saveTeam(teamID, teams) {
        await mysql.queryP(deleteSquad, teamID);
        let team1 = teams.team1;
        let team2 = teams.team2;

        addToDB(team1, 0);
        addToDB(team2, 1);

        function addToDB(team, teamNumber) {
            for (let i in team) {
                mysql.queryP(addToSquad, [team[i].username, teamNumber, teamID]);
            }
        }
        return "OK";
    }

    async getSquadForTeam(teamID) {
        let players = await mysql.queryP(getSquadForTeam, teamID);
        for (let i in players) {
            let info = await this.getTeamDataForPlayer(teamID, players[i].playerUsername);
            let profile = await Storage.getUserByUsername(players[i].playerUsername);
            players[i].info = info;
            players[i].name = `${profile.firstName} ${profile.lastName}`
        }
        return players;
    }

    async getTeamDataForPlayer(teamid, username) {
        return (await mysql.queryP(getTeamDataForPlayer, [teamid, username]))[0];
    }
}

function getNewId() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const idLength = 16;
    let out = "";
    for (let i = 0; i < idLength; i++) {
        let rnd = Math.floor(Math.random() * chars.length);
        out += chars[rnd];
    }
    if (Storage.verifyID(out)) {
        return out;
    } else {
        return getNewId();
    }
}

async function getToken() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const idLength = 16;
    let out = "";
    for (let i = 0; i < idLength; i++) {
        let rnd = Math.floor(Math.random() * chars.length);
        out += chars[rnd];
    }
    if (Storage.isTokenValid(out)) {
        return out;
    } else {
        return getToken();
    }
}

let Storage = new Database();
module.exports = Storage;