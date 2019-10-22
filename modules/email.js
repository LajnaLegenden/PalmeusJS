

class Mail {
    send(email, subject, type, ) {
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
}

function getHtml(type) {
}


let mail = new Mail();
module.exports = mail;