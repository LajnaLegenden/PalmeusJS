const Storage = require('./storage')
const mysql = require('./mysql');

var events = require('events');

const updateTime = `UPDATE teams SET nextEvent = ? WHERE id = ?`


class Scheduler {
    constructor(interval) {
        this.eventEmitter = new events.EventEmitter();
        this.updateTeams();

        setInterval(() => {
            this.eventEmitter.emit('doStuff');
        }, interval * 1000)
    }

    async updateTeams() {
        this.allTeams = await Storage.getAllTeams();
        this.cleanUp();
    }

    cleanUp() {
        for (let i in this.allTeams) {
            let obj = this.allTeams[i];

            let dayasNumber = 0;
            switch (obj.dayOfTheWeek) {
                case "Sunday":
                    dayasNumber = 0;
                    break;
                case "Monday":
                    dayasNumber = 1;
                    break;
                case "Tuesday":
                    dayasNumber = 2;
                    break;
                case "Wednesday":
                    dayasNumber = 3;
                    break;
                case "Thursday":
                    dayasNumber = 4;
                    break;
                case "Friday":
                    dayasNumber = 5;
                    break;
                case "Saturday":
                    dayasNumber = 6;
                    break;
                default:
                    dayasNumber = 1;
            }
            let time = this.nextDay(new Date(), dayasNumber, obj.time)
            time = mysql.escape(time);
            mysql.queryP(updateTime, [time, obj.id])
        }
    }

    nextDay(d, dow) {
        d.setDate(d.getDate() + (dow + (7 - d.getDay())) % 7);
        return d;
    }

    nextDay(d, dow, time) {
        let hr = time.substring(0, 2);
        let min = time.substring(3, 5);

        d.setDate(d.getDate() + (dow + (7 - d.getDay())) % 7);
        d.setHours(hr);
        d.setMinutes(min)
        d.setSeconds(0);
        return d;
    }
}
let s = new Scheduler(60)
module.exports = s;