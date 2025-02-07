const connection = require("../modules/mysql");

async function doStuff() {
    await connection.queryP("drop table if exists invite");
    await connection.queryP(`
    CREATE TABLE invite (
        id varchar(255),
        typeOfInvite varchar(63),
        fromUserID varchar(255),
        toEmailOrUsername varchar(63),
        position varchar(15),
        elo varchar(15),
        team varchar(127)
    );`, (error, results, fields) => {
        if (error) {
            console.log("error creating table topics ", error);
            process.exit(-1);
        }

        connection.query("SHOW TABLES", (error, result, fields) => {
            console.log("created tables!", error, result, fields);
        })
    })
    connection.end();
}

doStuff();
