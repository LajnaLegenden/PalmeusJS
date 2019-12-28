const Storage = require('./storage');
const fs = require('fs');

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
            if (err) {
                console.log(err);
            }
            console.log("Sent email to " + email)
            return "Invite sucsess"
        });
    }

    async invite(inviteID, teamId, email, fUser) {
        let fromUser = await Storage.getUserByUsername(fUser);
        let team = await Storage.getTeamById(teamId);

        const source = fs.readFileSync("views/email/invite.hbs", "utf8");
        const template = this.hbs.compile(source);

        const data = {
            team, fromUser, inviteID
        };
        const html = template(data);

        this.send(email, `Invite to join ${team.name}`, html);
    }
}

module.exports = Mail;