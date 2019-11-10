const connection = require("../modules/mysql");

async function doStuff() {
    await connection.queryP("drop table if exists admin");
    await connection.queryP(`
    CREATE TABLE admin (
        teamID varchar(255),
        userID varchar(255),
        addedByID varchar(255)
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
