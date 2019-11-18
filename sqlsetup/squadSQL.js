const connection = require("../modules/mysql");

async function doStuff() {
    await connection.queryP("drop table if exists squad");
    await connection.queryP(`
    CREATE TABLE squad (
        teamID varchar(127),
        team integer(4),
        userID varchar(127)
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
