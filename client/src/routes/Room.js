import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "simple-peer";
import io from "socket.io-client";
import ClientVideo from "../Components/ClientVideo";
import { Container } from "../Components/Container";
import Video from "../Components/Video";
import { iceConfig } from "../config/iceConfig";
import { checkCameraDevices } from "../helpers/checkCameraDevice";
import { checkAudioDevices } from "../helpers/checkAudioDevices";

const Room = () => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const { roomID } = useParams();
    const [clientStream, setClientStream] = useState();

    useEffect(() => {
        console.log(peers);
    }, [peers]);
    useEffect(() => {
        async function ByForce() {
            socketRef.current = io.connect("https://yorkbritishacademy.net/");

            // socketRef.current = io.connect("http://localhost:3001");
            navigator.mediaDevices
                .getUserMedia({
                    video: (await checkCameraDevices())
                        ? {
                            height: window.innerHeight / 2,
                            width: window.innerWidth / 2,
                        }
                        : false,
                    audio: await checkAudioDevices(),
                })
                .then((stream) => {
                    setClientStream(stream);
                    userVideo.current.srcObject = clientStream ?? stream;

                    socketRef.current.emit("join room", roomID);
                    socketRef.current.on("all users", (users) => {
                        const peers = [];
                        // create peer connection for each user for me
                        users.forEach((userID) => {
                            //user id is the old socket_id already in room 
                            const peer = createPeer(
                                userID, // the old user socket id 
                                socketRef.current.id, // new user socket id 
                                clientStream ?? stream // stream for new user 
                            );
                            // the peer is the peer of the new user 

                            peersRef.current.push({
                                peerID: userID,
                                peer,
                            });
                            peers.push(peer);
                        });
                        setPeers(peers);
                    });
                    socketRef.current.on("user joined", (payload) => {
                        // payload
                        // signal: payload.signal, //new user SDP 
                        // callerID: payload.callerID, // new_user_socket_id


                        console.log(payload); // {SDP for new user,new_user_socket_id}
                        const peer = addPeer(
                            payload.signal, //SPD for new user
                            payload.callerID, // socket id (new user for room)
                            clientStream ?? stream // stream for old user 
                        );
                        peersRef.current.push({
                            peerID: payload.callerID,
                            peer,
                        });
                        setPeers((users) => [...users, peer]);
                    });
                    socketRef.current.on("user-leave", (e) => {
                        console.log("user leave", e, peersRef.current);
                    });

                    socketRef.current.on("receiving returned signal", (payload) => {
                        const item = peersRef.current.find((p) => p.peerID === payload.id);
                        item.peer.signal(payload.signal);
                        // NOTE :here must remove the old peer form peers array and may in peerRef and may add the new peer
                    });
                })
                .catch((err) => console.log(err));
        }
        ByForce();

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        // userToSignal :old user socket id 
        // callerID :new user socket id 
        // stream

        /**
         This line creates a new instance of the Peer class.
          The initiator property is set to true, indicating that this peer will initiate the connection.
          trickle is set to false, which means ICE candidates won't be sent until the peer connection is fully established.
          stream is a media stream that this peer will send to other peers. 
         config is an optional parameter containing ICE server configuration.
         */
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: iceConfig,
        });
        console.log(peer);
        // This line sets up an event listener for the "signal" event emitted by the peer object.
        //  When the peer generates a signaling message (e.g., an SDP offer or answer), 
        // this event will be triggered,
        //  and the provided callback function will be executed.
        //  Inside this callback, the signaling message (signal) is passed as an argument.
        peer.on("signal", (signal) => {
            socketRef.current.emit("sending signal", {
                userToSignal,// any user_socket_id in room (old user in room)
                callerID, // my socket id (new user for room)
                signal,// may be have the sdp offer or answer for new user 
            });
        });
        return peer;
    }

    //you can specify a STUN server here
    const iceConfiguration = iceConfig;

    const localConnection = new RTCPeerConnection(iceConfiguration);

    // localConnection.onicecandidate = (e) => {
    //     // console.log(" NEW ice candidate!! on localconnection reprinting SDP ");
    //     // console.log(JSON.stringify(localConnection.localDescription));
    // };
    // const sendChannel = localConnection.createDataChannel("sendChannel");
    // sendChannel.onmessage = (e) => console.log("messsage received!!!" + e.data);
    // sendChannel.onopen = (e) => console.log("open!!!!");
    // sendChannel.onclose = (e) => console.log("closed!!!!!!");

    // localConnection
    //     .createOffer()
    //     .then((o) => localConnection.setLocalDescription(o));

    function addPeer(incomingSignal, callerID, stream) {
        // incomingSignal :SPD for new user
        // callerID :socket id for new user
        // stream 
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: iceConfig,
        });

        peer.on("signal", (signal) => {
            //signal is the SDP for old user
            socketRef.current.emit("returning signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <Container>
            <ClientVideo
                clientStream={clientStream}
                setClientStream={setClientStream}
                userVideo={userVideo}
                localConnection={localConnection}
                peers={peers}
            />
            {peers.map((peer, index) => {
                return <Video key={index} peer={peer} />;
            })}
        </Container>
    );
};

export default Room;
// abood connect on socket 
// abood get his media 
// set abood stream in  userVideo
// send event ot server "join room" with room id to add abood to the room and notify all users 
// in "join room " the server add abood to the room ,then get all users stay in the room (amgad) and send emit "all users" with {old_users_socket_ids} (amgad socket id )
// in "all user" make for each in old users then create_peer for them
// in create peer { send the old user socket id (amgad) , and new user socket id (abood) , abood stream} 
// in create peer we create peer for new user (abood) 
// in create peer : after creating the peer we send an emit "sending signal" with {amgad socket id , abood socket id , signal:abood(SDP)} 
// in create peer : "sending signal" send emit "user joined" to the old user (amgad ) the abood {socket id and SDP}
// to be continue in future 😁
