const kurento = require('kurento-client');
const minimist = require('minimist');
const config = require('../config');

let kurentoClient = null;
const iceCandidateQueues = {};

const {as_uri, ws_uri} = config;
const argv = minimist(process.argv.slice(2), {
    default: {as_uri, ws_uri}
});

class SocketEvent {
    constructor(io) {
        this.io = io;
    }

    joinRoom(socket, username, roomname, callback) {
        this.getRoom(socket, roomname, (err, myRoom) => {
            if (err) {
                return callback(err);
            }
            myRoom.pipeline.create('WebRtcEndpoint', (err, outgoingMedia) => {
                if (err) {
                    return callback(err);
                }
                let myRoom = this.io.sockets.adapter.rooms[roomname] || {length: 0};
                let numClients = myRoom.length;
                let isPresenter = false;
                if (numClients === 1) isPresenter = true;
                const user = {
                    id: socket.id,
                    name: username,
                    outgoingMedia: outgoingMedia,
                    incomingMedia: {}
                };
                let iceCandidateQueue = iceCandidateQueues[user.id];
                if (iceCandidateQueue) {
                    while (iceCandidateQueue.length) {
                        let ice = iceCandidateQueue.shift();
                        console.error(`user: ${user.name} collect candidate for outgoing media`);
                        user.outgoingMedia.addIceCandidate(ice.candidate);
                    }
                }

                user.outgoingMedia.on('OnIceCandidate', event => {
                    let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                    socket.emit('message', {
                        event: 'candidate',
                        userid: user.id,
                        isPresenter,
                        candidate: candidate
                    });
                });

                socket.to(roomname).emit('message', {
                    event: 'newParticipantArrived',
                    userid: user.id,
                    username: user.name,
                    isPresenter,
                });

                let existingUsers = [];
                console.log(myRoom.participants, 'myRoom.participants');
                for (let i in myRoom.participants) {
                    if (myRoom.participants[i].id !== user.id) {
                        existingUsers.push({
                            id: myRoom.participants[i].id,
                            name: myRoom.participants[i].name,
                        });
                    }
                }
                socket.emit('message', {
                    event: 'existingParticipants',
                    existingUsers: existingUsers,
                    userid: user.id,
                    isPresenter
                });

                myRoom.participants[user.id] = user;
            });
        });
    }

    deleteUser(io, userData) {
        const rooms = this.io.sockets.adapter.rooms;
        const deleteUser =userData[0];
        const roomNumber  = userData[1];
        delete rooms[deleteUser];
        if(rooms[roomNumber]) delete rooms[roomNumber]['sockets'][deleteUser];
        if(rooms[roomNumber]) delete rooms[roomNumber]['participants'][deleteUser];
        io.sockets.emit('message', {
            event: 'deleteUser',
            deleteUser
        });
    }

    receiveVideoFrom(socket, userid, roomname, sdpOffer, callback) {
        this.getEndpointForUser(socket, roomname, userid, (err, endpoint) => {
            if (err) {
                return callback(err);
            }

            endpoint.processOffer(sdpOffer, (err, sdpAnswer) => {
                if (err) {
                    return callback(err);
                }

                socket.emit('message', {
                    event: 'receiveVideoAnswer',
                    senderid: userid,
                    sdpAnswer: sdpAnswer
                });

                endpoint.gatherCandidates(err => {
                    if (err) {
                        return callback(err);
                    }
                });
            });
        })
    }

    addIceCandidate(socket, senderid, roomname, iceCandidate, callback) {
        let user = this.io.sockets.adapter.rooms[roomname].participants[socket.id];
        if (user != null) {
            let candidate = kurento.register.complexTypes.IceCandidate(iceCandidate);
            if (senderid === user.id) {
                if (user.outgoingMedia) {
                    user.outgoingMedia.addIceCandidate(candidate);
                } else {
                    iceCandidateQueues[user.id].push({candidate: candidate});
                }
            } else {
                if (user.incomingMedia[senderid]) {
                    user.incomingMedia[senderid].addIceCandidate(candidate);
                } else {
                    if (!iceCandidateQueues[senderid]) {
                        iceCandidateQueues[senderid] = [];
                    }
                    iceCandidateQueues[senderid].push({candidate: candidate});
                }
            }
            callback(null);
        } else {
            callback(new Error("addIceCandidate failed"));
        }
    }

    getRoom(socket, roomname, callback) {
        let myRoom = this.io.sockets.adapter.rooms[roomname] || {length: 0};
        let numClients = myRoom.length;

        console.log(roomname, ' has ', numClients, ' clients');

        if (numClients === 0) {
            socket.join(roomname, () => {
                myRoom = this.io.sockets.adapter.rooms[roomname];
                this.getKurentoClient((error, kurento) => {
                    kurento.create('MediaPipeline', (err, pipeline) => {
                        if (error) {
                            return callback(err);
                        }

                        myRoom.pipeline = pipeline;
                        myRoom.participants = {};
                        callback(null, myRoom);
                    });
                });
            });
        } else {
            socket.join(roomname);
            callback(null, myRoom);
        }
    }

    getKurentoClient(callback) {
        if (kurentoClient !== null) {
            return callback(null, kurentoClient);
        }

        kurento(argv.ws_uri, function (error, _kurentoClient) {
            if (error) {
                console.log("Could not find media server at address " + argv.ws_uri);
                return callback("Could not find media server at address" + argv.ws_uri
                    + ". Exiting with error " + error);
            }

            kurentoClient = _kurentoClient;
            callback(null, kurentoClient);
        });
    }

    getEndpointForUser(socket, roomname, senderid, callback) {
        var myRoom = this.io.sockets.adapter.rooms[roomname];
        var asker = myRoom.participants[socket.id];
        var sender = myRoom.participants[senderid];

        if (asker.id === sender.id) {
            return callback(null, asker.outgoingMedia);
        }

        if (asker.incomingMedia[sender.id]) {
            sender.outgoingMedia.connect(asker.incomingMedia[sender.id], err => {
                if (err) {
                    return callback(err);
                }
                callback(null, asker.incomingMedia[sender.id]);
            });
        } else {
            myRoom.pipeline.create('WebRtcEndpoint', (err, incoming) => {
                if (err) {
                    return callback(err);
                }

                asker.incomingMedia[sender.id] = incoming;

                let iceCandidateQueue = iceCandidateQueues[sender.id];
                if (iceCandidateQueue) {
                    while (iceCandidateQueue.length) {
                        let ice = iceCandidateQueue.shift();
                        console.error(`user: ${sender.name} collect candidate for outgoing media`);
                        incoming.addIceCandidate(ice.candidate);
                    }
                }

                incoming.on('OnIceCandidate', event => {
                    let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                    socket.emit('message', {
                        event: 'candidate',
                        userid: sender.id,
                        candidate: candidate
                    });
                });

                sender.outgoingMedia.connect(incoming, err => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, incoming);
                });
            });
        }
    }
}

module.exports = SocketEvent;
