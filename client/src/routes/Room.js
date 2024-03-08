import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import ClientVideo from "../Components/ClientVideo";
import { Container } from "../Components/Container";
import Video from "../Components/Video";
import { iceConfig } from "../config/iceConfig";
import { checkCameraDevices } from "../helpers/checkCameraDevice";
import { checkAudioDevices } from "../helpers/checkAudioDevices";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { Button, Modal } from "antd";

const Room = () => {
  const socketRef = useRef();
  const userVideo = useRef();
  const clientStreamRef = useRef(); // userStream
  const peersRef = useRef([]); // was a single peer

  const [peers, setPeers] = useState([]);
  const history = useHistory();
  const { roomID } = useParams();

  const [ayhamStram, setAyhamStream] = useState();
  const [permissionDenied, setPermissionDenied] = useState();

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
        clientStreamRef.current = stream;
        userVideo.current.srcObject = clientStreamRef.current;

        setPermissionDenied(false);
        setAyhamStream(stream);

        socketRef.current.emit("join room", roomID);

        socketRef.current.on("all users", handleAllUsersEvent);

        socketRef.current.on("offer", handleRecieveCall);

        socketRef.current.on("answer", handleAnswer);

        socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

        socketRef.current.on("user-leave", handleUserLeave);

      })
      .catch((err) => {
        setPermissionDenied(true);
        console.log(err);
      });
  }
  useEffect(() => {
    ByForce();
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  function callUser(userID, socket_id, clientStream) {
    const peer = createPeer(userID, true);
    clientStream
      .getTracks()
      .forEach((track) => peer.addTrack(track, clientStream));

    return peer;
  }

  function createPeer(userID, initiator) {
    const peer = new RTCPeerConnection(iceConfig);

    peer.onicecandidate = (e) => handleICECandidateEvent(e, userID);
    // peer.ontrack = handleTrackEvent;
    if (initiator) {
      peer.onnegotiationneeded = () =>
        handleNegotiationNeededEvent(userID, peer);
    }

    return peer;
  }

  function handleRecieveCall(incoming) {
    const peer = createPeer(incoming.callerID, false);
    const desc = new RTCSessionDescription(incoming.signal);
    peer
      .setRemoteDescription(desc)
      .then(() => {
        clientStreamRef.current
          .getTracks()
          .forEach((track) => peer.addTrack(track, clientStreamRef.current));
      })
      .then(() => {
        return peer.createAnswer();
      })
      .then((answer) => {
        return peer.setLocalDescription(answer);
      })
      .then(() => {
        const payload = {
          userToSignal: incoming.callerID,
          callerID: socketRef.current.id,
          signal: peer.localDescription,
        };
        socketRef.current.emit("answer", payload);
      });
    peersRef.current.push({
      peerID: incoming.callerID,
      peer,
    });
    setPeers((peers) => [...peers, peer]);
  }

  function handleAnswer(message) {
    const desc = new RTCSessionDescription(message.signal);
    const item = peersRef.current.find(
      (peerRef) => peerRef.peerID === message.id
    );
    console.log("item", item);
    item.peer.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming.candidate);
    const item = peersRef.current.find(
      (peerRef) => peerRef.peerID === incoming.id
    );
    console.log("new Ice", item);
    console.log("state before", item?.peer.iceConnectionState);
    item.peer
      .addIceCandidate(candidate)
      .then(() => {
        console.log("state after", item?.peer.iceConnectionState);
      })
      .catch((e) => console.log(e));
  }

  function handleNegotiationNeededEvent(userID, peer) {
    console.log("Negotiation", userID, peer);
    if (userID) {
      peer
        .createOffer()
        .then((offer) => {
          return peer.setLocalDescription(offer);
        })
        .then(() => {
          const payload = {
            userToSignal: userID,
            callerID: socketRef.current.id,
            signal: peer.localDescription,
          };
          socketRef.current.emit("offer", payload);
        })
        .catch((e) => console.log(e));
    }
  }

  function handleICECandidateEvent(e, userId) {
    if (e?.candidate) {
      const item = peersRef.current.find(
        (peerRef) => peerRef.peerID === userId
      );
      console.log(
        "before ice event to server",
        userId,
        item,
        item?.peer.iceConnectionState
      );
      const payload = {
        userToSignal: userId,
        candidate: e.candidate,
      };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  function handleAllUsersEvent(users) {
    const peers = [];
    users.forEach((userID) => {
      //user id is the old socket_id already in room
      const peer = callUser(
        userID, // the old user socket id
        socketRef.current.id, // new user socket id
        clientStreamRef.current // stream for new user
      );
      // the peer is the peer of the new user
      peersRef.current.push({
        peerID: userID,
        peer,
      });
      peers.push(peer);
    });
    setPeers(peers);
  }

  function handleUserLeave(userID) {
    const removedPeer = peersRef.current.filter(
      (peer) => peer.peerID === userID
    );
    const newPeers = peersRef.current.filter((peer) => peer.peerID !== userID);
    console.log("user leave");
    console.log(userID);
    console.log("removedPeer", removedPeer);
    console.log("newPeers", newPeers);
    peersRef.current = newPeers;
    setPeers(peersRef.current.map((peer) => peer.peer));
  }

  return (
    <>
      <Modal
        centered
        onOk={() => {
          window.location.reload();
          // ByForce();
        }}
        okText="Retry"
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
        closable={false}
        title="Need Permissions"
        open={permissionDenied}
      >
        <p>You have to enable video and audio permission to use our app</p>
      </Modal>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          backgroundColor: "#282829",
          padding: 10,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            size="large"
            danger
            type="primary"
            onClick={() => {
              history.push("/");
              clientStreamRef.current?.getTracks()?.forEach((track) => {
                console.log(track);
                track.stop();
              });
            }}
          >
            Leave Room
          </Button>
        </div>
        <Container>
          <ClientVideo
            ayhamStram={ayhamStram}
            setAyhamStream={setAyhamStream}
            clientStream={clientStreamRef.current}
            userVideo={userVideo}
            peers={peers}
          />
          {peers.map((peer, index) => {
            return <Video key={peersRef.current[index].peerID} peer={peer} />;
          })}
        </Container>
      </div>
    </>
  );
};

export default Room;