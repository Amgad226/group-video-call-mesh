import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
// import Peer from "peerjs";
import Peer from "simple-peer";
import styled from "styled-components";
import { useParams } from "react-router-dom";

const backgroundImageUrl = "../../public/logo192.png";

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 100%; 
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    background-color: #282829;
`;

const generateRandomColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
};

// Styled video component with random border color
const StyledVideo = styled.video`
    width: 100%;
    max-width: 300px;
    height: auto;
    margin: 10px;
    border: 10px solid ${props => props.borderColor}; // Dynamic border color
    border-radius: 5px;
`;

const Video = (props) => {
    const [borderColor, setBorderColor] = useState(generateRandomColor()); // State for border color

    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return <StyledVideo playsInline autoPlay ref={ref} borderColor={borderColor} />;

}


const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const { roomID } = useParams();

    useEffect(() => {

        socketRef.current = io.connect("https://yorkbritishacademy.net/");
        // socketRef.current = io.connect("http://localhost:3001");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push(peer);
                })
                setPeers(peers);
            })

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })

                setPeers(users => [...users, peer]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });
        })
    }, []);


    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    {
                        urls: "stun:stun.stunprotocol.org"
                    },
                    {
                        urls: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com'
                    },
                    {
                        urls: "stun:stun.relay.metered.ca:80",
                    },
                    {
                        urls: "turn:standard.relay.metered.ca:80",
                        username: "86721531a8351f5134873628",
                        credential: "glTfzJOpzAiRVSBE",
                    },
                    {
                        urls: "turn:standard.relay.metered.ca:80?transport=tcp",
                        username: "86721531a8351f5134873628",
                        credential: "glTfzJOpzAiRVSBE",
                    },
                    {
                        urls: "turn:standard.relay.metered.ca:443",
                        username: "86721531a8351f5134873628",
                        credential: "glTfzJOpzAiRVSBE",
                    },
                    {
                        urls: "turns:standard.relay.metered.ca:443?transport=tcp",
                        username: "86721531a8351f5134873628",
                        credential: "glTfzJOpzAiRVSBE",
                    },


                ]
            }
        });
        console.log(peer);

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }


    //you can specify a STUN server here

    const iceConfiguration = {}
    iceConfiguration.sdpSemantics="unified-plan"
    iceConfiguration.iceTransportPolicy="all"
    iceConfiguration.iceServers = [
        {
            urls: "stun:stun.relay.metered.ca:80",
        },
        {
            urls: "turn:standard.relay.metered.ca:80",
            username: "86721531a8351f5134873628",
            credential: "glTfzJOpzAiRVSBE",
        },
        {
            urls: "turn:standard.relay.metered.ca:80?transport=tcp",
            username: "86721531a8351f5134873628",
            credential: "glTfzJOpzAiRVSBE",
        },
        {
            urls: "turn:standard.relay.metered.ca:443",
            username: "86721531a8351f5134873628",
            credential: "glTfzJOpzAiRVSBE",
        },
        {
            urls: "turns:standard.relay.metered.ca:443?transport=tcp",
            username: "86721531a8351f5134873628",
            credential: "glTfzJOpzAiRVSBE",
        }
    ]

    const localConnection = new RTCPeerConnection(iceConfiguration)

    localConnection.onicecandidate = e => {
        console.log(" NEW ice candidate!! on localconnection reprinting SDP ")
        console.log(JSON.stringify(localConnection.localDescription))
    }
    const sendChannel = localConnection.createDataChannel("sendChannel");
    sendChannel.onmessage = e => console.log("messsage received!!!" + e.data)
    sendChannel.onopen = e => console.log("open!!!!");
    sendChannel.onclose = e => console.log("closed!!!!!!");


    localConnection.createOffer().then(o => localConnection.setLocalDescription(o))

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    {
                        urls: "stun:stun.stunprotocol.org"
                    },
                    {
                        urls: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com'
                    },
                ]
            }
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer, index) => {
                return (
                    <Video key={index} peer={peer} />
                );
            })}
        </Container>
    );
};

export default Room;
