const asyncHandler = require('express-async-handler')
//test
const Storage = require('./storage');
const Mail = require('./Mail');
const generateTeam = require('./generateTeam');
const reportScore = require('./reportScore');

module.exports = (app, hbs) => {

    let mail = new Mail(hbs);

    app.get("*", async (req, res, next) => {
        res.locals.myUsername = req.session.user;
        if (req.session.user) {
            res.locals.isSiteAdmin = (await Storage.getSiteAdmin(req.session.user)).length ? true : false;
            res.locals.isTeamManager = (await Storage.getTeamManger(req.session.user)).length ? true : false;
            res.locals.isTeamAdmin = (await Storage.isTeamAdmin(await Storage.getUserIdFromUsername(req.session.user), req.url.split("/")[2])).length ? true : false
            res.locals.teamID = req.url.split("/")[2] || undefined
        }
        console.log(res.locals)
        next()
    })

    //Index page
    app.get('/', async (req, res) => {
        res.render('index', { title: 'PalmeusJS' });
    });

    //Login
    app.get('/signin', (req, res) => {
        if (req.session.user != undefined) {
            if (req.session.returnUrl)
                res.redirect(req.session.returnUrl)
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
                (url);
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
        let doStuff = true;
        let err = {};
        let fName = req.body.fName;
        let lName = req.body.lName;
        let username = req.body.username.toLowerCase();
        let password1 = req.body.password1;
        let password2 = req.body.password2;
        let email = req.body.email;


        username = username.charAt(0).toUpperCase() + username.slice(1);
        let i = await Storage.isRealUsername(username);
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
            if (req.session.returnUrl != undefined) {
                let url = req.session.returnUrl;
                req.session.returnUrl = undefined;
                res.redirect(url);
            } else {
                res.redirect('/');
            }
        } else {
            (err);
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
        console.time("teams")
        let user = await Storage.getUserByUsername(req.session.user);
        let managedTeams = await Storage.getManagedTeamsByUsername(req.session.user);
        let joinedTeams = await Storage.getTeamsByUsername(req.session.user);
        let invites = await Storage.getTeamInvitesForUser(user.username, user.email);
        let noOfInvites = invites.length;
        let noTeam = true
        //TODO ReWRITE this
        /*  let promises = new Array();
         for (let i in joinedTeams) {
             joinedTeams[i].status = await Storage.getStatusForTeam(joinedTeams[i].id, req.session.user);
             joinedTeams[i].size = await Storage.getPlayers(joinedTeams[i].id, true);
             joinedTeams[i].going = await Storage.getAllGoingPlayers(joinedTeams[i].id, true);
             let thisPromiseArray = new Array();
             thisPromiseArray.push(joinedTeams[i].status)
             thisPromiseArray.push(joinedTeams[i].size)
             thisPromiseArray.push(joinedTeams[i].going)
             promises.push(Promise.all(thisPromiseArray));
             if (!await joinedTeams[i].status) {
                 joinedTeams[i].status.response = "Not Going";
             }
             console.log(i)
         }
         await Promise.all(promises)
         console.log("Done with promises") */

        for (let i in joinedTeams) {
            joinedTeams[i].status = await Storage.getStatusForTeam(joinedTeams[i].id, req.session.user);
            joinedTeams[i].size = (await Storage.getPlayers(joinedTeams[i].id)).length;
            joinedTeams[i].going = (await Storage.getAllGoingPlayers(joinedTeams[i].id)).length;
            if (!joinedTeams[i].status) {
                joinedTeams[i].status.response = "Not Going";
            }
        }

        for (let i in managedTeams) {
            managedTeams[i].size = (await Storage.getPlayers(managedTeams[i].id)).length;
            managedTeams[i].going = (await Storage.getAllGoingPlayers(managedTeams[i].id)).length;
        }

        if (managedTeams != "" || joinedTeams != "" || invites.length != 0) {
            noTeam = false;
        }
        console.timeEnd("teams")
        res.render('team/teams', { title: 'Your teams', noOfInvites, managedTeams, joinedTeams, invites, noTeam });
    });

    //Status for team
    app.post('/team/:id/changeStatus', teamAuth, async (req, res) => {

        let teamID = req.params.id;
        await Storage.changeStatus(teamID, req.session.user, req.body.status);
        let r = await Storage.getStatusForTeam(teamID, req.session.user);
        res.send(r);
    });

    //Create Team
    app.get('/team/create', auth, (req, res) => {
        res.render('team/createTeam', { title: 'Create a team' });
    });

    app.post('/team/createTeam', auth, validate, (req, res) => {
        let a = req.body;
        let pricePer = parseInt(a.pricePer) || 0;
        let pricePerSeason = parseInt(a.pricePerSeason) || 0;
        let maxPlayers = parseInt(a.maxPlayers) || -1;
        let dayasNumber = 0;
        switch (a.day) {
            case "Sunday":
                dayasNumber = 0;
                break;
            case "Monday":
                dayasNumber = 1;
                break;
            case "Tuesday":
                dayasNumber = 2;
                break;
            case "Wednesday":
                dayasNumber = 3;
                break;
            case "Thursday":
                dayasNumber = 4;
                break;
            case "Friday":
                dayasNumber = 5;
                break;
            case "Saturday":
                dayasNumber = 6;
                break;
            default:
                dayasNumber = 1;
        }
        Storage.createTeam(a.nameOfEvent, a.description, a.location, a.time, a.day, dayasNumber, req.session.user, pricePer, pricePerSeason, maxPlayers)
        res.redirect('/teams')
    });

    //Shot team info

    app.get('/team/:id', teamAuth, async (req, res) => {
        let teamID = req.params.id;
        let team = await Storage.getTeamById(teamID)
        let status = await Storage.getStatusForTeam(teamID, req.session.user);
        let members = await Storage.getPlayers(teamID);
        let unsortedTeams = await Storage.getSquadForTeam(teamID);
        let render = true;
        let team1 = [], team2 = [];
        let isAdmin = (await Storage.verifyAdmin(teamID, req.session.user)).length >= 1 ? true : false;
        for (let i in unsortedTeams) {
            if (unsortedTeams[i].team == 0)
                team1.push(unsortedTeams[i]);
            else
                team2.push(unsortedTeams[i]);
        }
        if (unsortedTeams.length == 0)
            render = false

        let squad = { team1, team2 }

        for (let i in members) {
            members[i].response = (await Storage.getStatusForTeam(teamID, members[i].username)).response;
        }
        res.render('team/showTeam', { showTeam: render, title: "Your teams", team, isAdmin, members, status, squad })
    });
    //Team Manager
    app.get('/team/:id/manage', auth, async (req, res) => {
        let id = req.params.id;
        let admin = await Storage.verifyAdmin(id, req.session.user);
        if (!admin.length) {
            res.redirect('/');
        }
        else {

            let team = await Storage.getTeamById(id);
            let members = await Storage.getPlayers(id);
            let time = new Date(team.nextEvent) - new Date();
            for (let i in members) {
                members[i].response = (await Storage.getStatusForTeam(id, members[i].username)).response;
            }
            time /= 1000;
            time /= 60;
            let min = time % 60;
            let hrs = time / 60
            console.log(members)
            for (let i in members) {
                let data = await Storage.getUserByID(members[i].userID);
                members[i].playerData = data;

            }
            (members);
            res.render('team/teamControl', { title: team.name, team: team, members })
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

            let team = await Storage.getTeamById(id);
            res.render('team/teamInvite', { title: team.name, team: team, invites: await Storage.getPendingInvites(req.params.id) })
        }

    });

    app.post('/team/:id/invite', auth, async (req, res) => {
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
            console.log(inviteBy, "typeofInvite")


            switch (inviteBy) {
                case "Email":
                    let user = await Storage.getUserByEmail(userOrEmail);
                    if (user.length != 0) {
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
                Storage.inviteByEmail(email, req.body.elo, req.body.pos, req.session.user, id).then(async (inviteID) => {
                    mail.invite(inviteID, id, email, req.session.user);
                });
            }
            async function err(err) {
                let error = {}
                error.message = err;

                let team = await Storage.getTeamById(id);
                res.render('team/teamInvite', { title: team.name, team: team, error })
            }
            res.redirect('/team/' + id + '/invite');
        }

    });
    //Accpet invite
    app.get('/acceptInvite/:id', auth, async (req, res) => {
        let inviteID = req.params.id;
        let invite = await Storage.getInvite(inviteID);
        if (invite.length == 0) res.redirect('/')
        invite = invite[0]
        let user = await Storage.getUserByUsername(req.session.user);
        console.log("asdadsd")
        if (user.email == invite.toEmailOrUsername || user.username == invite.toEmailOrUsername) {
            console.log("asdadsd")
            if (invite) {
                let team = await Storage.getTeamById(invite.team);
                let fromUser = await Storage.getUserByUsername(invite.fromUserID);
                res.render('acceptInvite', { invite, inviteID, team, fromUser })
                return;
            } else {
                console.log("Not for him")
                res.render('index', { title: 'PalmeusJS', err: "This invite was not ment for this email adress or username" })
                return;
            }
        }
        console.log("Not for him")
        res.render('index', { title: 'PalmeusJS', err: "This invite was not ment for this email adress or username. (Is the email the same as the one reciving the invite?)" })
        return;
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

    app.post('/team/:id/report', teamAuth, async (req, res) => {
        let teamID = req.params.id;
        let r = req.body.score;
        if (r.includes('1')) {
            var result = "TEAM1"
        } else if (r.includes('2')) {
            var result = "TEAM2"
        } else {
            var result = "DRAW"
        }

        reportScore(result, teamID);
        res.redirect('/team/' + teamID + '/manage')

    })

    app.get('/team/:id/showTeam', teamAuth, async (req, res) => {
        let teamID = req.params.id;
        let unsortedTeams = await Storage.getSquadForTeam(teamID);
        let render = true;
        let team1 = [], team2 = [];
        for (let i in unsortedTeams) {
            if (unsortedTeams[i].team == 0)
                team1.push(unsortedTeams[i]);
            else
                team2.push(unsortedTeams[i]);
        }
        let teams = { team1, team2 };
        if (unsortedTeams.length == 0)
            render = false
        let odds1;
        if (req.query)
            odds1 = req.query.o; odds2 = 1 - odds1;
        if (!odds1 && !odds2) {
            odds1 = undefined;
            odds2 = undefined;
        }
        console.log("Render", render)
        res.render('team/showSquad', { showTeam: render, team: teams, teamid: teamID, odds: { odds1, odds2 } });
    });

    app.post('/leaveTeam/:id', teamAuth, async (req, res) => {
        let teamID = req.params.id;
        let r = await Storage.leaveTeam(req.session.user, teamID);
        if (r = "NO") {
            res.redirect('/team/' + teamID)
        } else {
            res.redirect('/teams')
        }
        console.log(r)
    });

    //AdminConsole
    app.get('/admin', siteAdminAuth, async (req, res) => {
        res.render('admin/admin', { users: await Storage.getAllUsers(), emails: await Storage.getAllEmails() })
    });

    app.get('/admin/viewMail/:id', async (req, res, next) => {
        let html = (await Storage.getEmail(req.params.id)).html;
        res.render('admin/viewEmail', { html })
    });

    app.post('/user/:id/setAdmin', siteAdminAuth, async (req, res) => {
        console.log("Got data", req.body, req.params.id)
        await Storage.setPremissionStatus("admin", req.body.val, req.params.id)
        res.send("OK")
    });

    app.post('/user/:id/setTeamManager', siteAdminAuth, async (req, res) => {
        console.log("Got data", req.body, req.params.id)
        await Storage.setPremissionStatus("teamManager", req.body.val, req.params.id)
        res.send("OK")
    });
};


function auth(req, res, next) {
    if (!req.session.user) {
        req.session.returnUrl = req.url;
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
        let cID = await Storage.getUserIdFromUsername(req.session.user);
        for (let i in players) {
            if (players[i].userID == cID);
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


async function siteAdminAuth(req, res, next) {

    if (!res.locals.isSiteAdmin && res.locals.isSiteAdmin != undefined) {
        console.log("Not admin", req.session.user, res.locals.isSiteAdmin)
        return res.back()
    } else if ((await Storage.getSiteAdmin(req.session.user)).length ? false : true) {
        console.log("Not admin", req.session.user, res.locals.isSiteAdmin)
        return res.back()
    }
    console.log("Is Admin")
    next()
}