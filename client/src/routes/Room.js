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
import { Button, Modal, Space } from "antd";

const Room = () => {
  const socketRef = useRef();
  const userVideo = useRef();
  const clientStreamRef = useRef(); // userStream
  const peersRef = useRef([]); // was a single peer

  const [peers, setPeers] = useState([]);
  const [iAdmin, setIAdmin] = useState(false);
  const [forceMuted, setForceMuted] = useState(false);
  const [forceVideoStoped, setForceVideoStoped] = useState(false);
  const [adminMuteAll, setAdminMuteAll] = useState(false);
  const [adminStopCamAll, setAdminStopCamAll] = useState(false);

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

        socketRef.current.on("force-leave", handleForceLeave);

        socketRef.current.on("force-mute", handleForceMute);

        socketRef.current.on("force-cam-off", handleForceCamOff);

        socketRef.current.on("unmute", handleUnMute);

        socketRef.current.on("cam-on", handleCamOn);
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
    console.log(incoming);
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
      isAdmin: incoming.isAdmin,
    });
    setPeers((peers) => [...peers, { isAdmin: incoming.isAdmin, peer }]);
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
    console.log(users);
    const peers = [];
    if (users.length === 0) {
      setIAdmin(true);
    }
    users.forEach((remotePeer) => {
      //user id is the old socket_id already in room
      const peer = callUser(
        remotePeer.id, // the old user socket id
        socketRef.current.id, // new user socket id
        clientStreamRef.current // stream for new user
      );
      // the peer is the peer of the new user
      peersRef.current.push({
        peerID: remotePeer.id,
        isAdmin: remotePeer.isAdmin,
        peer,
      });
      peers.push({ isAdmin: remotePeer.isAdmin, peer });
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
    removedPeer[0]?.peer.close();
    peersRef.current = newPeers;
    setPeers(
      peersRef.current.map(({ peer, isAdmin }) => {
        return {
          peer,
          isAdmin,
        };
      })
    );
  }

  function handleForceLeave() {
    clientStreamRef.current?.getTracks()?.forEach((track) => {
      console.log(track);
      track.stop();
    });
    history.push("/");
  }

  function handleForceMute() {
    setForceMuted(true);
    // clientStreamRef.current
    //   ?.getAudioTracks()
    //   .forEach((track) => (track.enabled = false));
  }

  function handleUnMute() {
    setForceMuted(false);
    // clientStreamRef.current
    //   ?.getAudioTracks()
    //   .forEach((track) => (track.enabled = true));
  }

  function handleForceCamOff() {
    setForceVideoStoped(true);
    // clientStreamRef.current
    //   ?.getVideoTracks()
    //   .forEach((track) => (track.enabled = false));
  }

  function handleCamOn() {
    setForceVideoStoped(false);
    // clientStreamRef.current
    //   ?.getVideoTracks()
    //   .forEach((track) => (track.enabled = true));
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
        <Space
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
            type="default"
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
          {iAdmin && (
            <>
              <Button
                type="primary"
                size="large"
                danger
                onClick={() => {
                  socketRef.current.emit("end-call");
                }}
              >
                End Room For All
              </Button>
              {adminMuteAll && (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    setAdminMuteAll(false);
                    socketRef.current.emit("unmute-all");
                  }}
                >
                  Enable Talk
                </Button>
              )}
              {!adminMuteAll && (
                <Button
                  type="primary"
                  size="large"
                  danger
                  onClick={() => {
                    setAdminMuteAll(true);
                    socketRef.current.emit("mute-all");
                  }}
                >
                  Disable Talk
                </Button>
              )}
              {adminStopCamAll && (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    setAdminStopCamAll(false);
                    socketRef.current.emit("cam-on-all");
                  }}
                >
                  Enable Video
                </Button>
              )}
              {!adminStopCamAll && (
                <Button
                  type="primary"
                  size="large"
                  danger
                  onClick={() => {
                    setAdminStopCamAll(true);
                    socketRef.current.emit("cam-off-all");
                  }}
                >
                  Disable Video
                </Button>
              )}
            </>
          )}
        </Space>
        <Container>
          <ClientVideo
            ayhamStram={ayhamStram}
            setAyhamStream={setAyhamStream}
            clientStream={clientStreamRef.current}
            userVideo={userVideo}
            peers={peers}
            isAdmin={iAdmin}
            forceMuted={forceMuted}
            forceVideoStoped={forceVideoStoped}
          />
          {peers.map((peer, index) => {
            return (
              <Video
                id={peersRef.current[index].peerID}
                key={peersRef.current[index].peerID}
                peerObj={peer}
                iAdmin={iAdmin}
                socket={socketRef.current}
              />
            );
          })}
        </Container>
      </div>
    </>
  );
};

export default Room;
