const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const socketEvents = require('./controllers/socket_event');
const router = require('./routes/api');
//Setup https server
const app = express();
let server;
if (config.mode === 'local') {
    const options =
        {
            key: fs.readFileSync(config.env[config.mode].ssl.key),
            cert: fs.readFileSync(config.env[config.mode].ssl.cert)
        };
    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}
server.listen(config.server_port, function () {
    console.log('server up and running at %s port', config.server_port);
});
//Initialize the socket server
const io = require('socket.io')(server, {
    handlePreflightRequest: (req, res) => {
        console.log('req.header.origin', req.headers.origin);
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});
io.origins('*:*');

const SocketEvent = new socketEvents(io);
//enable cors
app.use(cors());
// express routing
app.use('/api', (req, res, next) => {
    req.SocketEvent = SocketEvent;
    next();
}, router);
app.use('/',express.static(path.join(__dirname,'../frontend/build')));
app.use('/presenters',express.static(path.join(__dirname,'../frontend/build')));
app.use('/static',express.static(path.join(__dirname,'../frontend/build/static')));
app.use('/assets',express.static(path.join(__dirname,'../frontend/build/assets')));
//debugging
// signaling
io.on('connection', function (socket) {
    socket.on('disconnecting', () => {
        let data = Object.keys(socket.rooms);

        SocketEvent.deleteUser(io,data);
    });
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
