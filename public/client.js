// getting dom elements
const divRoomSelection = document.getElementById('roomSelection');
const divMeetingRoom = document.getElementById('meetingRoom');
const inputRoom = document.getElementById('room');
const inputName = document.getElementById('name');
const btnRegister = document.getElementById('register');

// variables
let roomName;
let userName;
let participants = {};

// Let's do this
const socket = io();

btnRegister.onclick = function () {
    roomName = inputRoom.value;
    userName = inputName.value;

    if (roomName === '' || userName === '') {
        alert('Room and Name are required!');
    } else {
        const message = {
            event: 'joinRoom',
            userName: userName,
            roomName: roomName
        };
        sendMessage(message);
        divRoomSelection.style = "display: none";
        divMeetingRoom.style = "display: block";
    }
};

// messages handlers
socket.on('message', message => {
    console.log('Message received: ' + message.event);

    switch (message.event) {
        case 'newParticipantArrived':
            receiveVideo(message.userid, message.username);
            break;
        case 'existingParticipants':
            onExistingParticipants(message.userid, message.existingUsers);
            break;
        case 'receiveVideoAnswer':
            onReceiveVideoAnswer(message.senderid, message.sdpAnswer);
            break;
        case 'candidate':
            addIceCandidate(message.userid, message.candidate);
            break;
    }
});
// handlers functions
function receiveVideo(userid, username) {
    const video = document.createElement('video');
    const div = document.createElement('div');
    div.className = "videoContainer";
    const name = document.createElement('div');
    video.id = userid;
    video.autoplay = true;
    video.muted = false;
    name.appendChild(document.createTextNode(username));
    div.appendChild(video);
    div.appendChild(name);
    divMeetingRoom.appendChild(div);

    const user = {
        id: userid,
        username: username,
        video: video,
        rtcPeer: null
    };

    participants[user.id] = user;

    const options = {
        remoteVideo: video,
        mediaConstraints: {
            audio:true,
            video:true
        },
        onicecandidate: onIceCandidate
    };

    user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function (err) {
            if (err) {
                return console.error(err);
            }
            this.generateOffer(onOffer);
        }
    );

    const onOffer = function (err, offer, wp) {
        console.log('sending offer');
        const message = {
            event: 'receiveVideoFrom',
            userid: user.id,
            roomName: roomName,
            sdpOffer: offer
        };
        sendMessage(message);
    };

    function onIceCandidate(candidate, wp) {
        console.log('sending ice candidates');
        const message = {
            event: 'candidate',
            userid: user.id,
            roomName: roomName,
            candidate: candidate
        };
        sendMessage(message);
    }
}

function onExistingParticipants(userid, existingUsers) {
    const video = document.createElement('video');
    const div = document.createElement('div');
    div.className = "videoContainer";
    const name = document.createElement('div');
    video.id = userid;
    video.autoplay = true;
    video.muted = false;
    name.appendChild(document.createTextNode(userName));
    div.appendChild(video);
    div.appendChild(name);
    divMeetingRoom.appendChild(div);

    const user = {
        id: userid,
        username: userName,
        video: video,
        rtcPeer: null
    };

    participants[user.id] = user;

    const constraints = {
        audio: true,
        video : {
			mandatory : {
				maxWidth : 320,
				maxFrameRate : 15,
				minFrameRate : 15
			}
		}
    };

    const options = {
        localVideo: video,
        mediaConstraints: constraints,
        onicecandidate: onIceCandidate
    };

    user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
        function (err) {
            if (err) {
                return console.error(err);
            }
            this.generateOffer(onOffer)
        }
    );

    existingUsers.forEach(function (element) {
        receiveVideo(element.id, element.name);
    });

    const onOffer = function (err, offer, wp) {
        console.log('sending offer');
        const message = {
            event: 'receiveVideoFrom',
            userid: user.id,
            roomName: roomName,
            sdpOffer: offer
        };
        sendMessage(message);
    };

    function onIceCandidate(candidate, wp) {
        console.log('sending ice candidates');
        const message = {
            event: 'candidate',
            userid: user.id,
            roomName: roomName,
            candidate: candidate
        };
        sendMessage(message);
    }
}

function onReceiveVideoAnswer(senderid, sdpAnswer) {
    participants[senderid].rtcPeer.processAnswer(sdpAnswer);
}

function addIceCandidate(userid, candidate) {
    participants[userid].rtcPeer.addIceCandidate(candidate);
}

// utilities
function sendMessage(message) {
    console.log('sending ' + message.event + ' message to server');
    socket.emit('message', message);
}
