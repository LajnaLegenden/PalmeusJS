const Storage = require('./storage');

class Mail {
    constructor(hbs) {
        this.hbs = hbs;
    }

    send(email, subject, body) {
        let send = require('gmail-send')({
            user: 'palmeusjs@gmail.com',
            pass: process.env.GMAILPASS,
            to: email,
            subject: subject
        });


        send({ html: body }, (err, res, fullRes) => {
            if (err) console.error(err);
            console.log(res);
        });
    }

    async invite(inviteID, teamId, email, fUser) {
        let fromUser = await Storage.getUserByUsername(fUser);
        //Get html
    }
}


let mail = new Mail();
module.exports = mail;