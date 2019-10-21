const connection = require("../modules/mysql");

async function doStuff() {
    await connection.queryP("drop table if exists users");
    await connection.queryP(`
    CREATE TABLE users (
        Username varchar(255),
        id varchar(255),
        firstNe varchar(255),
        lastNe varchar(255),
        email varchar(255),
        password varchar(255)
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
