const connection = require("../modules/mysql");

async function doStuff() {
    await connection.queryP("drop table if exists status");
    await connection.queryP(`
    CREATE TABLE status (
        userID varchar(255),
        teamID varchar(255),
        response varchar(31)
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
