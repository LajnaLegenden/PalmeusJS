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
const addEmailInvite = `INSERT INTO invite (toEmail,elo,position,id,fromUser,team,typeOfInvite) VALUES (?,?,?,?,?,?,?)`
const joinTeam = `INSERT INTO members (username,teamID,elo,priority,attendance) VALUES (?,?,?,?,?)`
const getInvite = `SELECT * FROM invite WHERE id = ?`;

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
        await mysql.queryP(joinTeam, [admin, id, 0, true, 0]);
        return "OK";
    }
    async verifyID(id) {
        return !mysql.queryP(getUserByID, id) && !mysql.queryP(getTeamByID, id);
    }

    async getManagedTeamsByUsername(username) {
        return mysql.queryP(getManagedTeamsByUsername, username);
    }

    async getTeamsByUsername(username) {
        return mysql.queryP(getTeamsByUsername, username);
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
    async inviteByEmail(email, elo, pos, from, team) {
        let token = await getToken();
        console.log(email, elo, pos, from, token)
        let stmt = await mysql.queryP(addEmailInvite, [email, elo, pos, token, from, team, "EMAIL"]);
        return token;
    }

    async getInvite(id) {
        console.log(id);
        return await mysql.queryP(getInvite, id);
    }

    async isTokenValid(token) {
        return await !mysql.queryP(isTokenValid, token);
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