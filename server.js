const express = require('express');
const fs = require('fs');
const config = require('./config');
const https = require('https');
const socketEvents = require('./controllers/socket_event');
const router = require('./routes/api');
//Setup https server

const app = express();
const options =
    {
        key: fs.readFileSync('config/keys/server.key'),
        cert: fs.readFileSync('config/keys/server.crt')
    };
const server = https.createServer(options, app);
server.listen(config.server_port, function () {
    console.log('server up and running at %s port', config.server_port);
});
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
//Initialize the socket server
const io = require('socket.io')(server);
io.set('origins', '*');
const SocketEvent = new socketEvents(io);

// express routing
app.use('/api', (req, res, next) => {
    req.SocketEvent = SocketEvent;
    next();
}, router);
// app.use(express.static('public'));

// signaling
io.on('connection', function (socket) {
    socket.on('message', function (message) {
        console.log('Message received: ', message.event);
        switch (message.event) {
            case 'joinRoom':
                // joinRoom(socket, message.userName, message.roomName, err => {
                SocketEvent.joinRoom(socket, message.userName, message.roomName, err => {
                    if (err) {
                        console.log(err);
                    }
                });
                break;

            case 'receiveVideoFrom':
                SocketEvent.receiveVideoFrom(socket, message.userid, message.roomName, message.sdpOffer, err => {
                    if (err) {
                        console.log(err);
                    }
                });
                break;

            case 'candidate':
                SocketEvent.addIceCandidate(socket, message.userid, message.roomName, message.candidate, err => {
                    if (err) {
                        console.log(err);
                    }
                });
                break;
        }
    });
});
