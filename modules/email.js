
function gmail(toUser, subject, body) {
    let send = require('gmail-send')({
        user: 'palmeusjs@gmail.com',
        pass: process.env.GMAILPASS,
        to: toUser,
        subject: subject
    });

    send({ html: body }, (err, res, fullRes) => {
        if (err) console.error(err);
        console.log(res);
    });
}


module.exports = gmail;