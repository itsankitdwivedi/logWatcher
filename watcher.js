const events = require('events');
const fs = require('fs');
const bf = require('buffer');
const watchFile = "test.log";
const REQUIRED_LINES = 10;
const os = require('os');
// const buffer = new Buffer.alloc(bf.constants.MAX_STRING_LENGTH);

class Watcher extends events.EventEmitter{
    constructor(watchFile){
        super();
        this.watchFile = watchFile;
        this.logsStore = [];
    }
    getLogs()
    {
        return this.logsStore;
    }
    watch(curr, prev){
        const watcher = this;
        fs.open(this.watchFile, (err,fd) => {
            if (err) throw err;
            let data = '';
            let logs = [];
            let position = curr.size;
            let sizeToRead = curr.size - prev.size;
            let buffer = Buffer.alloc(sizeToRead);
    
            fs.read(fd, buffer, 0 , sizeToRead, prev.size, (err,bytesRead) => {
                if(err) throw err;
                if(bytesRead > 0){
                    data = buffer.slice(0,bytesRead).toString();
                    logs = data.split("\n").filter(line => line.trim().length > 0);
                    console.log("Logs read are : "+logs);
                    logs.forEach((log)=> {
                        if(this.logsStore.length === REQUIRED_LINES){
                            console.log("Queue is Full");
                            this.logsStore.shift();
                        }
                        this.logsStore.push(log);
                    });
                    watcher.emit("processLogs", logs);
                }
            });
        });
    }
    start() {
        let watcher = this;
        let logs = [];
        let totalLines = 0;
        let position = 0;
        let index;
    
        fs.stat(this.watchFile, (err, stats) => {
            if (err) throw err;
            position = stats.size;
            fs.open(this.watchFile, 'r', (err, fd) => {
                if (err) throw err;
                readFromPosition(position, fd);
            });
        });
    
        function readFromPosition(position, fd) {
            if (totalLines >= REQUIRED_LINES || position === 0) {
                watcher.logsStore = logs;
                fs.watchFile(watcher.watchFile, { interval: 1000 }, function(curr, prev) {
                    watcher.watch(curr, prev);
                });
                return;
            }
    
            let size = Math.min(1024, position);
            let buffer = Buffer.alloc(size);
    
            fs.read(fd, buffer, 0, size, position - size, (err, bytesRead) => {
                if (err) throw err;
    
                while ((index = buffer.lastIndexOf(os.EOL)) !== -1) {
                    console.log("Total lines" + totalLines);
                    logs.unshift(buffer.slice(index + 1).toString());
                    totalLines++;
                    if (totalLines === REQUIRED_LINES) break;
                    buffer = buffer.slice(0, index);
                }
    
                position -= bytesRead;
                readFromPosition(position, fd);
            });
        }
    }
}
module.exports = {Watcher};