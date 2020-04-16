require('dotenv').config({ path: './env/.env' });

const express = require('express');
const app = express();
const router = require('./modules/router.js');
const schedluer = require('./modules/scheduler')
const cookieSession = require("cookie-session");
const https = require('https');
const bodyParser = require('body-parser');
const http = require('http');
const hbs = require('hbs');
const fs = require('fs');
const back = require('express-back');

const port = process.env.PORT;

let server = http.createServer(app);

//Public
app.use('/public', express.static('public'));

//Handlebars setup
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

hbs.registerPartials(__dirname + '/views/partials');

//Helper for loops
hbs.handlebars.registerHelper('add', function (value, options) {
    return parseInt(value + 1);
});

//Validator
app.use(express.json());

//Cookie secret
app.use(cookieSession({
    secret: process.env.SECRET
}));

app.use(back());

app.use(bodyParser.urlencoded({ extended: true }));
//Use router
router(app, hbs.handlebars);


//Listen
server.listen(port, () => {
    console.log('Server Listening on port ' + port);
});
