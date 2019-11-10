const connection = require("../modules/mysql");

async function doStuff() {
    await connection.queryP("drop table if exists teams");
    await connection.queryP(`
    CREATE TABLE teams (
        name varchar(255),
        id varchar(255) PRIMARY KEY,
        description varchar(255),
        location varchar(255),
        time varchar(10),
        dayOfTheWeek varchar(15),
        creatorID varchar(255) ,
        priceSingle integer,
        priceWhole integer,
        maxplayers integer,
        nextEvent varchar(64)
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
