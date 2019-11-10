const Storage = require('./storage')

var events = require('events');



class Scheduler {
    constructor(interval) {
        console.log(interval);
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
            console.log(obj)
        }
    }

    nextDay(d, dow) {
        d.setDate(d.getDate() + (dow + (7 - d.getDay())) % 7);
        return d;
    }
}

/**
 * 
 * @param {*} d Date object
 * @param {*} dow Day of week, stating with Sunday eg 0 - Sunday
 */
nextDay(d, dow) {
    d.setDate(d.getDate() + (dow + (7 - d.getDay())) % 7);
    return d;
}

module.exports = Scheduler;