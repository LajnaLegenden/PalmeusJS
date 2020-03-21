const Storage = require('./storage');
const fs = require('fs');

class Mail {
    constructor(hbs) {
        this.hbs = hbs;
        if (process.env.MODE == "dev") {
            this.transport = require('nodemailer').createTransport({
                host: 'localhost',
                port: 1025,
                auth: {
                    user: 'project.1',
                    pass: 'secret.1'
                }
            });
        } else {
            this.transport = require('nodemailer').createTransport({
                host: "mail.bredband2.com",
                "secure": true,
                "auth": {
                    "user": process.env.EMAILUSER,
                    "pass": process.env.EMAILPASS
                }
            });
        }
    }

    async send(email, subject, body) {
        let res = {};
        try {
            res = await this.transport.sendMail({
                from: '"PalmeusJS" <palmeusJS@bredband2.com>',
                to: email,
                subject: subject,
                html: body
            });
        } catch (e) {
            console.log(e);
        } finally {
            console.log(res);
            await Storage.saveEmail(JSON.stringify(res), email, subject, body);
        }
    }


    oldsend(email, subject, body) {
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
            console.log('Sent email to ' + email);
            return 'Invite sucsess';
        });
    }

    async invite(inviteID, teamId, email, fUser) {
        let fromUser = await Storage.getUserByUsername(fUser);
        let team = await Storage.getTeamById(teamId);

        const source = fs.readFileSync('views/email/invite.hbs', 'utf8');
        const template = this.hbs.compile(source);

        const data = {
            team,
            fromUser,
            inviteID
        };
        const html = template(data);

        this.send(email, `Invite to join ${team.name}`, html);
    }
}

module.exports = Mail;
