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
            users.forEach((userID) => {
              const peer = createPeer(
                userID,
                socketRef.current.id,
                clientStream ?? stream
              );
              peersRef.current.push({
                peerID: userID,
                peer,
              });
              peers.push(peer);
            });
            setPeers(peers);
          });
          socketRef.current.on("user joined", (payload) => {
            console.log(payload);
            const peer = addPeer(
              payload.signal,
              payload.callerID,
              clientStream ?? stream
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
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: iceConfig,
    });
    console.log(peer);
    // peer.on('track' , g)
    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });
    return peer;
  }

  //you can specify a STUN server here
  const iceConfiguration = iceConfig;

  const localConnection = new RTCPeerConnection(iceConfiguration);

  localConnection.onicecandidate = (e) => {
    // console.log(" NEW ice candidate!! on localconnection reprinting SDP ");
    // console.log(JSON.stringify(localConnection.localDescription));
  };
  const sendChannel = localConnection.createDataChannel("sendChannel");
  sendChannel.onmessage = (e) => console.log("messsage received!!!" + e.data);
  sendChannel.onopen = (e) => console.log("open!!!!");
  sendChannel.onclose = (e) => console.log("closed!!!!!!");

  localConnection
    .createOffer()
    .then((o) => localConnection.setLocalDescription(o));

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: iceConfig,
    });
    peer.on("signal", (signal) => {
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
