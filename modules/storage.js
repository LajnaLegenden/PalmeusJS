//TODO
//FIX ALL FUNCTIONS IN STORAGE
//CHANGE FROM USERNAME TO ID IN REST OF CODE
const mysql = require("./mysql");
const bcrypt = require('bcryptjs');
const _ = require('lodash')

const getAllUsers = 'SELECT * FROM users ORDER BY admin,teamManager,id';
const createNewUser = `INSERT INTO users (firstName,lastName,username,email,password,id) VALUES (?,?,?,?,?,?)`;
const verifyUsername = `SELECT * FROM users WHERE username = ?`;
const getUserByID = `SELECT * FROM users WHERE id = ?`;
const getManagedTeamsByUsername = `SELECT * FROM teams WHERE creatorID = ?`;
const getTeamsByID = `SELECT * FROM members WHERE userID = ? ORDER BY ID`;

//Team
const addTeam = `INSERT INTO teams (name,id,description,location,time,dayOfTheWeek,creatorID,priceSingle,priceWhole,maxplayers,nextEvent) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
const addAdmin = `INSERT INTO admin (teamID,userID,addedByID) VALUES (?,?,?)`
const verifyAdmin = `SELECT * FROM admin WHERE userID = ? AND teamID = ?`;
const getTeamByID = `SELECT * FROM teams WHERE id = ?`;
const isRealUsername = `SELECT username FROM users WHERE username = ?`;
const isTokenValid = `SELECT * FROM invite WHERE id = ?`;
const addEmailInvite = `INSERT INTO invite (toEmailOrUsername,elo,position,id,fromUserID,team,typeOfInvite) VALUES (?,?,?,?,?,?,?)`
const addUsernameInvite = `INSERT INTO invite (toEmailOrUsername,elo,position,id,fromUserID,team,typeOfInvite) VALUES (?,?,?,?,?,?,?)`
const joinTeam = `INSERT INTO members (userID,teamID,elo,priority,attendance,position) VALUES (?,?,?,?,?,?)`
const getInvite = `SELECT * FROM invite WHERE id = ?`;
const getTeamInvitesForUser = `SELECT * FROM invite where toEmailOrUsername = ? and typeOfInvite = "USERNAME"`
const removeInvite = `DELETE FROM invite WHERE id = ?`;
const getPlayers = `SELECT * FROM members JOIN users on members.userID = users.id WHERE members.teamID = ?`
const getUserByEmail = `SELECT * FROM users WHERE email = ?`;
const addToSquad = `INSERT INTO squad (userID,team,teamID) VALUES (?,?,?)`;
const getSquadForTeam = `SELECT squad.team,squad.userID,squad.teamID,members.position,members.elo FROM squad JOIN members ON squad.teamID = members.teamID AND squad.teamID = ? AND squad.userID = members.userID ORDER BY FIELD(position,"GK","DF","FW"), userID`
const getTeamDataForPlayer = `SELECT * FROM members where teamID = ? AND userID = ?`;
const deleteSquad = `DELETE FROM squad WHERE teamID = ?`;
const getStatusForTeam = `SELECT response,teamID FROM status WHERE teamID = ? AND userID = ?`;
const removeStatus = `DELETE FROM status WHERE teamID = ? AND userID  = ?`
const changeStatus = `INSERT INTO status (teamID,userID,response) VALUES (?,?,?)`
const getAllGoingPlayers = `SELECT * FROM status WHERE teamID = ? AND response = "Going"`;
const getAllTeams = `SELECT * FROM teams`;
const getUserIdFromUsername = `SELECT id FROM users WHERE username = ?`
const updateElo = `UPDATE members SET elo = ? WHERE userID = ? AND teamID = ?`
const resetTeamSquad = `DELETE FROM squad WHERE teamID = ?`

const getTeamSize = `SELECT COUNT(userID) AS size FROM PJS_DEVELOP.members WHERE teamID = ?`


//Leave Team
const deleteFromStatus = `DELETE FROM status WHERE userID = ? and teamID = ?`
const deleteFromSquad = `DELETE FROM squad WHERE userID = ? AND teamID = ?`
const deleteFromMember = `DELETE FROM members WHERE userID = ? and teamID = ?`

const getSiteAdmin = `SELECT admin FROM users WHERE id = ? AND admin = 1`
const getTeamManager = `SELECT teamManager FROM users WHERE id = ? AND teamManager = 1`

const setPremissionStatusAdmin = `UPDATE users SET admin = ? WHERE id = ?`
const setPremissionStatusTeamManager = `UPDATE users SET teamManager = ? WHERE id = ?`

const getAllEmails = `SELECT * FROM mail`;
const saveEmail = `INSERT INTO mail (response,email,html,subject) VALUES (?,?,?,?)`;
const getEmail = `SELECT * FROM mail WHERE id = ?`;

class Database {
    //User functions
    async getUserByUsername(username) {

        let userID = await this.getUserIdFromUsername(username);

        let res = await mysql.queryP(getUserByID, userID);

        return res[0];
    }

    async resetTeamSquad(teamID) {
        await mysql.queryP(deleteSquad, teamID);
    }

    async getUserByID(id) {
        let res = await mysql.queryP(getUserByID, id);
        return res[0];
    }

    /**
     * Creates new user and adds to sql database
     * @param {string} username The username of the new user
     * @param {string}  password  Password of the new user
     * @param {string}  firstName Firstname of new user
     * @param {string}  lastName Lastname of new user
     * @param {string}  email Emmail of new user
     */

    async createNewUser(username, password, firstName, lastName, email) {
        let id = getNewId();
        let pass = await bcrypt.hash(password, 10);
        await mysql.queryP(createNewUser, [firstName, lastName, username, email, pass, id]);
        return id;
    }

    async getAllUsers() {
        return (await mysql.queryP(getAllUsers)).reverse();
    }

    async updateElo(userID, teamID, newElo) {
        newElo = Math.floor(newElo);
        mysql.queryP(updateElo, [newElo, userID, teamID]);
    }

    async verifyUser(username, password) {
        let user = (await this.getUserByUsername(username));
        if (user)
            return bcrypt.compare(password, user.password);
        else
            return false;
    }

    async getUserIdFromUsername(username) {
        let res;
        try {
            res = await mysql.queryP(getUserIdFromUsername, username);
        } catch (e) {
            console.log(e)
        } finally {
            return res[0].id;
        }
    }

async deleteUser(id){
    //To delete
/*
admin
invite on from id and to
members userID
squad userid
status userid
give team owndershit do someone else in the list from teams
last users
*/
const deleteFromAdmin = `DELETE FROM admin WHERE userID = ?`
const deleteFromInvites = `DELETE FROM invite WHERE fromUserID = ?`






}


    async createTeam(nameOfEvent, description, location, timeOfDay, dayOfWeek, dayOfWeekAsNumber, admin, priceSingle, priceMultiple, maxplayers) {
        let id = getNewId();
        let adminID = await this.getUserIdFromUsername(admin);
        let time = nextDay(new Date(), dayOfWeekAsNumber);
        time = mysql.escape(time);
        await mysql.queryP(addTeam, [nameOfEvent, id, description, location, timeOfDay, dayOfWeek, adminID, priceSingle, priceMultiple, maxplayers, time]);
        await mysql.queryP(addAdmin, [id, adminID, adminID]);
        await this.joinTeam(adminID, id, 1000, true, "FW");
        return "OK";
    }

    async joinTeam(user, teamId, elo, priority, pos) {
        await mysql.queryP(joinTeam, [user, teamId, elo, priority, 0, pos]);
    }

    async verifyID(id) {
        return !mysql.queryP(getUserByID, id) && !mysql.queryP(getTeamByID, id);
    }

    async getManagedTeamsByUsername(username) {
        let cID = await this.getUserIdFromUsername(username)
        return mysql.queryP(getManagedTeamsByUsername, cID);
    }

    async getTeamsByUsername(username) {
        let userID = await this.getUserIdFromUsername(username);
        let teams = await mysql.queryP(getTeamsByID, userID);
        let out = [];
        for (let i in teams) {
            let team = await this.getTeamById(teams[i].teamID);
            out.push(team);
        }
        return out;
    }

    async verifyAdmin(id, username) {
        let userID = await this.getUserIdFromUsername(username);
        return await mysql.queryP(verifyAdmin, [userID, id]);
    }

    async getTeamById(id) {
        return (await mysql.queryP(getTeamByID, id))[0];
    }

    async isRealUsername(username) {
        return (await mysql.queryP(isRealUsername, username)).length ? true : false;
    }

    async inviteByUsername(username, elo, pos, from, team, token) {
        from = await this.getUserIdFromUsername(from);
        let stmt = await mysql.queryP(addUsernameInvite, [username, elo, pos, token, from, team, "USERNAME"]);
        return "OK";
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
        user = await this.getUserIdFromUsername(user);
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

    async getPlayers(id, length = false) {
        let res = await mysql.queryP(getPlayers, id);
        if (length) return res.length
        return res;
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

        await addToDB(team1, 0);
        await addToDB(team2, 1);

        async function addToDB(team, teamNumber) {

            for (let i in team) {
                await mysql.queryP(addToSquad, [team[i].userID, teamNumber, teamID]);
            }
        }

        return "OK";
    }

    async getSquadForTeam(teamID) {
        let players = await mysql.queryP(getSquadForTeam, teamID);

        for (let i in players) {
            // let info = await this.getTeamDataForPlayer(teamID, players[i].userID);
            let profile = await Storage.getUserByID(players[i].userID);
            //  players[i].info = info;
            players[i].name = `${profile.firstName} ${profile.lastName}`
        }
        return players;
    }

    async getTeamDataForPlayer(teamid, username) {
        return (await mysql.queryP(getTeamDataForPlayer, [teamid, username]))[0];
    }

    async getStatusForTeam(teamID, username) {
        let userID = await this.getUserIdFromUsername(username);
        let res = await mysql.queryP(getStatusForTeam, [teamID, userID]);
        if (res.length == 0) {
            return { response: "Not Going", teamID: teamID }
        } else {
            return res[0];
        }
    }

    async changeStatus(teamID, username, status) {
        let cID = await this.getUserIdFromUsername(username);
        await mysql.queryP(removeStatus, [teamID, cID]);
        await mysql.queryP(changeStatus, [teamID, cID, status]);
        return await this.getStatusForTeam(teamID, username);
    }

    async getAllGoingPlayers(teamID, length = false) {
        let res = await mysql.queryP(getAllGoingPlayers, [teamID, "Going"]);
        if (length) return res.length;
        return res;
    }

    async getAllTeams() {
        return await mysql.queryP(getAllTeams);
    }

    async leaveTeam(username, teamID) {
        let cID = await this.getUserIdFromUsername(username);
        //Dont allow if admin  for now
        let admin = await this.verifyAdmin(teamID, username);
        if (admin.length != 0) {
            return "NO"
        } else {
            mysql.queryP(deleteFromStatus, [cID, teamID])
            mysql.queryP(deleteFromSquad, [cID, teamID])
            mysql.queryP(deleteFromMember, [cID, teamID])
            return "OK";
        }


    }

    async getSiteAdmin(user) {
        let id = await this.getUserIdFromUsername(user);
        return await mysql.queryP(getSiteAdmin, id);
    }

    async getTeamManger(user) {
        let id = await this.getUserIdFromUsername(user);
        return await mysql.queryP(getTeamManager, id);
    }

    async setPremissionStatus(prem, val, userID) {
        let n = null;
        if (val == "true") n = 1
        console.log(n)
        switch (prem) {
            case "admin":
                return await mysql.queryP(setPremissionStatusAdmin, [n, userID])
            case "teamManager":
                return await mysql.queryP(setPremissionStatusTeamManager, [n, userID])
        }
    }

    async saveEmail(res, to, subject, body) {
        await mysql.queryP(saveEmail, [res, to, body, subject]);
    }

    async getAllEmails() {
        let fromDb = await mysql.queryP(getAllEmails);
        let out = new Array();
        for (let mail of fromDb) {
            let tmp = mail;
            tmp.response = JSON.parse(tmp.response);
            out.push(tmp);
        }
        return out;
    }
    async getEmail(id) {
        let res = await mysql.queryP(getEmail, id);
        if (res.length == 0) return { html: "<h1>Email not found</h1>" }
        return res[0];
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

function nextDay(d, dow) {
    d.setDate(d.getDate() + (dow + (7 - d.getDay())) % 7);
    return d;
}

let Storage = new Database();
module.exports = Storage;
