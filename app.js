require('dotenv').config({ path: './env' });

const express = require('express');
const app = express();
const router = require('./modules/router.js');
const hbs = require('express-hbs');
const cookieSession = require("cookie-session");
const https = require('https');
const bodyParser = require('body-parser');
const http = require('http');




const port = process.env.PORT;

let server = http.createServer(app);

//Public
app.use('/public', express.static('public'));

//Handlebars setup
app.engine('hbs', hbs.express4());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');



//Validator
app.use(express.json());

//Cookie secret
app.use(cookieSession({
    secret: process.env.SECRET
}));
app.use(bodyParser.urlencoded({ extended: true }));
//Use router
router(app);


//Listen
server.listen(port, () => {
    console.log('Server Listening on port ' + port);
});
