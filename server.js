import express from "express";
import fs from "fs";
import https from "https";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import {socketEventsController} from "./controllers";
import router from "./routes";

require('dotenv').config();
const config = require('./config/config.' + process.env.MODE.toLowerCase());
//Setup https server
const app = express();
let server;
if (process.env.MODE.toLowerCase() === 'local') {
    const options =
        {
            key: fs.readFileSync(config.ssl.key),
            cert: fs.readFileSync(config.ssl.cert)
        };
    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}
server.listen(config.server_port, async function () {
    await mongoose.connect("mongodb://localhost/osvdb");
});
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.json());
//enable cors
app.use(cors());
//Initialize the socket server
const io = require('socket.io')(server, {
    handlePreflightRequest: (req, res) => {
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

const SocketEvent = new socketEventsController(io);
//debugging
// signaling

io.on('connection', function (socket) {
    socket.on('disconnecting', (res, id) => {
         
        // let data = Object.keys(socket.rooms);
        // SocketEvent.deleteUser(io, data);
    });
    socket.on('disconnect', function () {
        const rooms = io.sockets.adapter.rooms;
        Object.keys(rooms).forEach(item=>{
               if(rooms[item]['participants']) if(rooms[item]['participants'][socket.id]) delete rooms[item]['participants'][socket.id]
        });
        io.sockets.emit('message', {
            event: 'deleteUser',
            deleteUser:socket.id
        });
    });
    socket.on('message', function (message) {
        switch (message.event) {
            case 'joinRoom':
                // joinRoom(socket, message.userName, message.roomName, err => {
                SocketEvent.joinRoom(socket, message.userName, message.roomName, message.audienceRoom, message.isPresenter, err => {
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
router(app, SocketEvent);
