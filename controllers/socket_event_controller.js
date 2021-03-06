const kurento = require('kurento-client');
const minimist = require('minimist');
require('dotenv').config();
const config = require('../config/config.' + process.env.MODE.toLowerCase());
let kurentoClient = null;
const iceCandidateQueues = {};

const {as_uri, ws_uri} = config;
const argv = minimist(process.argv.slice(2), {
    default: {as_uri, ws_uri}
});
// import {EventController, UserController} from "../controllers";
const controllers = require('../controllers');
class SocketEvent {
    constructor(io) {
        this.io = io;
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
    async checkIfPresenter(name, room){
        const UserController = controllers.UserController;
        const EventController = controllers.EventController;
        const userCtrl = new UserController();
        const eventCtrl = new EventController();
        const userResultData = await userCtrl.getUsersFieldsByParams({name},{_id:0});
        if(userResultData.result!=='success') return false;
        if(!userResultData.data.length>0) return false;
        const eventData = await eventCtrl.getEventsFieldsByParams({user_id:userResultData.data[0].user_id, event_id:room},{_id:0});
        if(eventData.data.length>0) return true;
        console.log(eventData,'eventData')

    }
    getAudicenRoomNumber(participantsObj){
        let audienceRoomNumber = 0;
        participantsObj = Object.assign({},participantsObj);
        const chunk_size = config.audienceCountPerRoom;
        let participants=[];
        const participantKeys = Object.keys(participantsObj);
        Object.keys(participantsObj).map(item=>{
            if(!participantsObj[item]['isPresenter']){
                participants.push(participantsObj[item])
            }
        })
        if(participants.length>0){
            let audienceRoomAry = [];
            participants.forEach((item)=>{
                audienceRoomAry.push(item.audienceRoom);
            })
            let maxofary = Math.max.apply(Math, audienceRoomAry);
            const lastaudienceroomary = participants.filter((item)=>{
               return item['audienceRoom'] ==maxofary;
            })
            if(lastaudienceroomary.length>=chunk_size){
                audienceRoomNumber =  maxofary+1;
            }else{
                audienceRoomNumber =  maxofary;
            }
        }
        return audienceRoomNumber;
    }
    joinRoom(socket, message, callback) {
        let {username, roomname, userid, isPresenter} =message;
        let audienceRoom;
        this.getRoom(socket, roomname,  (err, myRoom) => {
            if (err) {
                return callback(err);
            }
            myRoom.pipeline.create('WebRtcEndpoint', async (err, outgoingMedia) => {
                if (err) {
                    return callback(err);
                }
                let myRoom = this.io.sockets.adapter.rooms[roomname] || {length: 0};
                isPresenter = await this.checkIfPresenter(username,roomname);
                audienceRoom = this.getAudicenRoomNumber(myRoom.participants);
                const user = {
                    id: socket.id,
                    name: username,
                    audienceRoom:audienceRoom,
                    isPresenter:isPresenter,
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
                        candidate: candidate,                        
                        audienceRoom:user.audienceRoom,
                        isPresenter:user.isPresenter
                    });
                });

                socket.to(roomname).emit('message', {
                    event: 'newParticipantArrived',
                    userid: user.id,
                    username: user.name,
                    audienceRoom:user.audienceRoom,
                    isPresenter:user.isPresenter
                });

                this.getExistingUserList(socket,roomname,user);
                myRoom.participants[user.id] = user;
            });
        });
    }

    getExistingUserList(socket, roomname,user){
        let myRoom = this.io.sockets.adapter.rooms[roomname] || {length: 0};
        const participants = myRoom.participants;
        let existingUsers = [];
        for (let i in participants) {
            if (participants[i].id !== user.id) {
                existingUsers.push({
                    id: participants[i].id,
                    name: participants[i].name,
                    audienceRoom: participants[i].audienceRoom,
                    isPresenter: participants[i].isPresenter,
                });
            }
        }
        socket.emit('message', {
            event: 'existingParticipants',
            existingUsers: existingUsers,
            userid: user.id,
            audienceRoom:user.audienceRoom,
            isPresenter:user.isPresenter
        });
    }



    deleteUser(io, socket) {
        // const rooms = io.sockets.adapter.rooms;
        // Object.keys(rooms).forEach(item=>{
        //        if(rooms[item]['participants']) if(rooms[item]['participants'][socket.id]) delete rooms[item]['participants'][socket.id]
        // });
        // io.sockets.emit('message', {
        //     event: 'deleteUser',
        //     deleteUser
        // });
    }

    receiveVideoFrom(socket, message, callback) {
        let {userid, roomName, sdpOffer} = message;
        this.getEndpointForUser(socket, roomName, userid, (err, endpoint) => {
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

        const myRoom = this.io.sockets.adapter.rooms[roomname];
        const asker = myRoom.participants[socket.id];
        const sender = myRoom.participants[senderid];
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
                        candidate: candidate,
                        audienceRoom:sender.audienceRoom,
                        isPresenter:sender.isPresenter
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
