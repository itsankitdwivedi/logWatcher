const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const { Watcher } = require('./watcher');

let watcher = new Watcher("test.log");
watcher.start();
const port = 3000;

app.get('/log', (req,res,next) => {
    console.log("Fetching Logs");
    let options = {
        root : path.join(__dirname, 'public')
    };
    let fileName = "index.html";
    res.sendFile(fileName, options, function(err){
        if(err){
            next(err);
        }
        else{
            console.log('sent the file: '+fileName);
        }
    });
});

io.on('connection', function(socket){
   watcher.on("processLogs", function process(data){
    socket.emit("log-update", data);
   });
   let data = watcher.getLogs();
   socket.emit("init", data);
});

http.listen(port, function(){
    console.log(`Server running at http://localhost:${port}`);
});