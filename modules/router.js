const Storage = require('./storage');
const email = require('./email');

const validator = require('express-validator');

module.exports = (app) => {
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

    app.post('/signin', validate, async (req, res) => {
        let err = {};
        let username = req.body.username.toLowerCase();
        username = username.charAt(0).toUpperCase() + username.slice(1);
        let correct = await Storage.verifyUser(username, req.body.password);
        if (correct) {
            req.session.user = username;
            if (req.session.returnUrl != undefined) {
                let url = req.session.returnUrl;
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
        let i = (await Storage.getUserByUsername(username)).length;
        if (i != 0) {
            err.message = "Username already exists";
            err.fields = ["username"];
            doStuff = false;
        } else if (validateEmail(email)) {
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
            res.render('signup', { title: 'Sign up', err });
        }
    });
    // Sign out
    app.get('/signout', (req, res) => {
        req.session.user = undefined;
        res.redirect('/');
    });


    app.get('/mail', (req, res) => {
        email('00jansson@gmail.com', 'test', '<h1>HEJSAN</h1>');
    })

    //Teams
    app.get('/teams', auth, async (req, res) => {
        let managedTeams = await Storage.getManagedTeamsByUsername(req.session.user);
        let joinedTeams = null;//await Storage.getTeamsByUsername(req.session.user);
        let noTeam = true
        if (managedTeams != "" || joinedTeams != null) {
            noTeam = false;
        }
        res.render('teams', { title: 'Your teams', loggedIn: req.session.user, managedTeams, managedTeams, noTeam });
    });

    //Create Team
    app.get('/teams/create', auth, (req, res) => {
        res.render('createTeam', { title: 'Create a team' });
    });

    app.post('/teams/createTeam', validate, (req, res) => {
        console.log(req.body);
        let a = req.body;
        let pricePer = parseInt(a.pricePer) || 0;
        let pricePerSeason = parseInt(a.pricePerSeason) || 0;
        let maxPlayers = parseInt(a.maxPlayers) || -1;
        Storage.createTeam(a.nameOfEvent, a.description, a.location, a.time, a.day, req.session.user, pricePer, pricePerSeason, maxPlayers)
        res.redirect('/teams')
    });

    app.get('/teams/:id', async (req, res) => {
        let id = req.params.id;
        let admin = await Storage.verifyAdmin(id, req.session.user);
        if (!admin.length) {
            res.redirect('/');
        }
        else {
            let loggedIn = req.session.user;
            let team = await Storage.getTeamById(id);
            console.log(team);
            res.render('teamControl', { title: team.name, loggedIn, team: team })
        }

    });

    app.get('/teams/:id/invite', async (req, res) => {
        let id = req.params.id;
        let admin = await Storage.verifyAdmin(id, req.session.user);
        if (!admin.length) {
            res.redirect('/');
        }
        else {
            let loggedIn = req.session.user;
            let team = await Storage.getTeamById(id);
            res.render('teamInvite', { title: team.name, loggedIn, team: team })
        }

    });
    app.post('/teams/:id/invite', async (req, res) => {
        let id = req.params.id;
        let admin = await Storage.verifyAdmin(id, req.session.user);
        if (!admin.length) {
            res.redirect('/');
        }
        else {
            let userOrEmail = req.body.userOrEmail;
            let pos = req.body.pos;
            let elo = parseInt(req.body.elo);
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
                    inviteByEmail(userOrEmail);
                    //Create invite token
                    //Send Email
                    //Show res to admin
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

            function sendInviteToUsername(toUser) {
                inviteByEmail(toUser.email)
            }
            async function inviteByEmail(email) {

                let invite = await Storage.inviteByEmail(email, req.body.elo, req.body.pos, req.session.user, id);
            }
            async function err(err) {
                let error = {}
                error.message = err;
                let loggedIn = req.session.user;
                let team = await Storage.getTeamById(id);
                res.render('teamInvite', { title: team.name, loggedIn, team: team, error })
            }
            res.redirect('/teams/' + id + '/invite');
        }

    });
}

function auth(req, res, next) {
    if (!req.session.user) {
        req.session.returnUrl = req.url;
        res.redirect('/signin')
    } else {
        next();
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
