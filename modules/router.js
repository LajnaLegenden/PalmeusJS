const asyncHandler = require('express-async-handler')

const Storage = require('./storage');
const Mail = require('./Mail');
const generateTeam = require('./generateTeam');

module.exports = (app, hbs) => {

    let mail = new Mail(hbs);
    //Index page
    app.get('/', async (req, res) => {
        let loggedIn = req.session.user == undefined ? false : req.session.user;
        res.render('index', { title: 'PalmeusJS', loggedIn });
    });

    //Login
    app.get('/signin', (req, res) => {
        if (req.session.user != undefined) {
            console.log(req);
        }
        res.render('signin', { title: 'Sign in' });
    });
    //Signin
    app.post('/signin', validate, async (req, res) => {
        let err = {};
        let username = req.body.username.toLowerCase();
        username = username.charAt(0).toUpperCase() + username.slice(1);
        let correct = await Storage.verifyUser(username, req.body.password);
        if (correct) {
            req.session.user = username;
            if (req.session.returnUrl != undefined) {
                let url = req.session.returnUrl;
                console.log(url);
                req.session.returnUrl = undefined;
                res.redirect(url);
            } else {
                res.redirect('/');
            }
        } else {
            err.message = "Wrong username or password";
            res.render('signin', { title: 'Sign in', err });
        }
    });

    //Signup
    app.get('/signup', (req, res) => {
        if (req.session.user != undefined) {
            res.redirect('/');
        } else {
            res.render('signup', { title: 'Sign up' })
        }
    });

    app.post('/signup', validate, async (req, res) => {
        console.log(req.body)
        let doStuff = true;
        let err = {};
        let fName = req.body.fName;
        let lName = req.body.lName;
        let username = req.body.username.toLowerCase();
        let password1 = req.body.password1;
        let password2 = req.body.password2;
        let email = req.body.email;



        username = username.charAt(0).toUpperCase() + username.slice(1);
        let i = await Storage.getUserByUsername(username);
        if (i) {
            err.message = "Username already exists";
            err.fields = ["username"];
            doStuff = false;
        } else if (!validateEmail(email)) {
            err.message = "Email must be valid";
            doStuff = false;
        } else if (password1 != password2) {
            err.message = "The passwords does not match";
            err.fields = ["password1", "password2"];
            doStuff = false;
        } else if (password1.length < 7) {
            err.message = "The passwords must be longer than 7 characters";
            err.fields = ["password1", "password2"];
            doStuff = false;
        }
        if (doStuff) {
            let id = await Storage.createNewUser(username, password1, fName, lName, email);
            if (id != undefined)
                req.session.user = username;
            res.redirect('/');
        } else {
            console.log(err);
            res.render('signup', { title: 'Sign up', err, data: req.body });
        }
    });
    // Sign out
    app.get('/signout', (req, res) => {
        req.session.user = undefined;
        res.redirect('/');
    });

    //Teams
    app.get('/teams', auth, async (req, res) => {
        let managedTeams = await Storage.getManagedTeamsByUsername(req.session.user);
        let joinedTeams = await Storage.getTeamsByUsername(req.session.user);
        let invites = await Storage.getTeamInvitesForUser(req.session.user);
        let noOfInvites = invites.length;
        let noTeam = true
        if (managedTeams != "" || joinedTeams != "") {
            noTeam = false;
        }
        res.render('team/teams', { title: 'Your teams', loggedIn: req.session.user, noOfInvites, managedTeams, joinedTeams, invites, noTeam });
    });

    //Create Team
    app.get('/team/create', auth, (req, res) => {
        res.render('team/createTeam', { title: 'Create a team' });
    });

    app.post('/teams/createTeam', auth, validate, (req, res) => {
        let a = req.body;
        let pricePer = parseInt(a.pricePer) || 0;
        let pricePerSeason = parseInt(a.pricePerSeason) || 0;
        let maxPlayers = parseInt(a.maxPlayers) || -1;
        Storage.createTeam(a.nameOfEvent, a.description, a.location, a.time, a.day, req.session.user, pricePer, pricePerSeason, maxPlayers)
        res.redirect('/teams')
    });
    //Team Manager
    app.get('/team/:id/manage', auth, async (req, res) => {
        let id = req.params.id;
        let admin = await Storage.verifyAdmin(id, req.session.user);
        if (!admin.length) {
            res.redirect('/');
        }
        else {
            let loggedIn = req.session.user;
            let team = await Storage.getTeamById(id);
            let members = await Storage.getPlayers(id);
            for (let i in members) {
                let data = await Storage.getUserByUsername(members[i].username);
                members[i].playerData = data;
            }
            res.render('team/teamControl', { title: team.name, loggedIn, team: team, members })
        }
    });
    //Invite
    app.get('/team/:id/invite', auth, async (req, res) => {
        let id = req.params.id;
        let admin = await Storage.verifyAdmin(id, req.session.user);
        if (!admin.length) {
            res.redirect('/');
        }
        else {
            let loggedIn = req.session.user;
            let team = await Storage.getTeamById(id);
            res.render('team/teamInvite', { title: team.name, loggedIn, team: team })
        }

    });

    app.post('/team/:id/invite', async (req, res) => {
        let id = req.params.id;
        let admin = await Storage.verifyAdmin(id, req.session.user);
        if (!admin.length) {
            res.redirect('/');
        }
        else {
            let userOrEmail = req.body.userOrEmail;
            let fromUser = req.session.user;
            fromUser = Storage.getUserByUsername(fromUser);
            let inviteBy = "";
            if (validateEmail(userOrEmail)) {
                inviteBy = "Email";
            } else {
                inviteBy = 'Username';
            }
            switch (inviteBy) {
                case "Email":
                    let user = await Storage.getUserByEmail(userOrEmail);
                    if (user) {
                        sendInviteToUsername(user.username);
                    }
                    await inviteByEmail(userOrEmail);
                    break;
                case "Username":
                    //Is real username?
                    if (await Storage.isRealUsername(userOrEmail)) {
                        let toUser = await Storage.getUserByUsername(userOrEmail);
                        sendInviteToUsername(toUser);
                    } else {
                        err("Username is not valid. Try inviting by email instead");
                        return;
                    }
                    //Send invite
                    //Send email?
                    //Show confiramtion to admin
                    break;
                default:
                    throw new Error('Something has gone terribly wrong');
            }
            async function sendInviteToUsername(toUser) {
                Storage.inviteByEmail(toUser.email, req.body.elo, req.body.pos, req.session.user, id).then(async (inviteID) => {
                    mail.invite(inviteID, id, toUser.email, req.session.user);
                    await Storage.inviteByUsername(userOrEmail, req.body.elo, req.body.pos, req.session.user, id, inviteID);
                });
                // 
            }
            async function inviteByEmail(email) {
                Storage.inviteByEmail(email, req.body.elo, req.body.pos, req.session.user, id)
            }
            async function err(err) {
                let error = {}
                error.message = err;
                let loggedIn = req.session.user;
                let team = await Storage.getTeamById(id);
                res.render('team/teamInvite', { title: team.name, loggedIn, team: team, error })
            }
            res.redirect('/team/' + id + '/invite');
        }

    });
    //Accpet invite
    app.get('/acceptInvite/:id', auth, async (req, res) => {
        let inviteID = req.params.id;
        let invite = (await Storage.getInvite(inviteID))[0];
        let team = await Storage.getTeamById(invite.team);
        let fromUser = await Storage.getUserByUsername(invite.fromUser);

        res.render('acceptInvite', { invite, inviteID, team, fromUser, loggedin: req.session.user })
    });

    app.post('/acceptInvite/:id', auth, async (req, res) => {
        Storage.respondToInvite(req.params.id, req.body.yesorno, req.session.user);
        res.redirect('/teams');
    });

    //GetTeam
    app.get('/team/:id/getTeam', teamAuth, async (req, res) => {
        let teamid = req.params.id;
        let odds = await generateTeam(teamid);
        res.redirect('/team/' + teamid + '/showTeam?o=' + odds)
    });

    app.get('/team/:id/showTeam', teamAuth, async (req, res) => {
        let teamID = req.params.id;
        let unsortedTeams = await Storage.getSquadForTeam(teamID);
        let team1 = [], team2 = [];
        for (let i in unsortedTeams) {
            if (unsortedTeams[i].team == 0)
                team1.push(unsortedTeams[i]);
            else
                team2.push(unsortedTeams[i]);
        }
        let teams = { team1, team2 };
        let odds1 = 0;
        if (req.query.o)
            odds1 = req.query.o;
        odds2 = 1-odds1;
        res.render('team/showTeam', { loggedIn: req.session.user, team: teams, teamid: teamID, odds: {odds1,odds2} });
    });
};


function auth(req, res, next) {
    if (!req.session.user) {
        req.session.returnUrl = req.url;
        console.log(req.session.returnUrl);
        res.redirect('/signin');
        return true;
    } else {
        next();
    }
}

async function teamAuth(req, res, next) {
    if (auth(req, res, next)) {

        return;
    } else {
        let id = req.params.id;
        let players = await Storage.getPlayers(id);
        for (let i in players) {
            if (players[i].username == req.session.user)
                return;
        }
        res.redirect('/teams')
    }
}


function validate(req, res, next) {
    for (prop in req.body) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            "/": '&#x2F;',
            ";": '&#x3b;'
        };
        const reg = /[&<>"'/]/ig;
        req.body[prop] = req.body[prop].replace(reg, (match) => (map[match]));
    }
    next();
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
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
    let tolorance = 400;
    let r1 = Math.pow(10, elo1 / tolorance);
    let r2 = Math.pow(10, elo2 / tolorance);

    let totalR = r1 + r2;

    return r1 / totalR;
}