import { Button, Modal, Space } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import io from "socket.io-client";
import ClientVideo from "../Components/ClientVideo";
import { Container } from "../Components/Container";
import ShareScreen from "../Components/ShareScreen";
import Video from "../Components/Video";
import { iceConfig } from "../config/iceConfig";
import { checkConnectionState } from "../helpers/checkConnectionState";
import { createFakeVideoTrack } from "../helpers/createFakeVideoTrack";
import { getAvaliableUserMedia } from "../helpers/getAvaliableUserMedia";

const Room = () => {
  const socketRef = useRef();
  const userVideo = useRef();
  const clientStreamRef = useRef(); // userStream
  const shareScreenStreamRef = useRef(); // for share screen insted of the user video

  const newTrackForShareScreenRef = useRef();
  const [isShareScreenLayout, setIsShareScreenLayout] = useState(false);

  const peersRef = useRef([]);

  const [peers, setPeers] = useState([]);
  const [iAdmin, setIAdmin] = useState(false);
  const [forceMuted, setForceMuted] = useState(false);
  const [forceVideoStoped, setForceVideoStoped] = useState(false);
  const [adminMuteAll, setAdminMuteAll] = useState(false);
  const [adminStopCamAll, setAdminStopCamAll] = useState(false);

  const history = useHistory();
  const { roomID } = useParams();

  const [permissionDenied, setPermissionDenied] = useState();

  const [activeVideoDevice, setActiveVideoDevice] = useState(null);
  const [activeAudioDevice, setActiveAudioDevice] = useState(null);

  const [videoDeviceNotExist, setVideoDeviceNotExist] = useState(false);

  const [removedStreamObj, setRemoveStreamObj] = useState();

  async function ByForce() {
    socketRef.current = io.connect("https://yorkbritishacademy.net/");
    // socketRef.current = io.connect("http://localhost:3001");

    getAvaliableUserMedia()
      .then((stream) => {
        if (stream.getVideoTracks()[0]) {
          stream.getVideoTracks()[0].enabled = false;
          setActiveVideoDevice(
            stream.getVideoTracks()[0].getSettings().deviceId
          );
        } else {
          // the vocie problem from here
          const fakeVideoTrack = createFakeVideoTrack();
          console.log(fakeVideoTrack);
          stream.addTrack(fakeVideoTrack);
          setVideoDeviceNotExist(true);
        }

        if (stream.getAudioTracks()[0]) {
          setActiveAudioDevice(
            stream.getAudioTracks()[0].getSettings().deviceId
          );
        }
        console.log(stream.getTracks());

        clientStreamRef.current = stream;

        userVideo.current.srcObject = clientStreamRef.current;

        setPermissionDenied(false);

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

        socketRef.current.on("stream-removed", handleStreamRemoved);
      })

      .catch((err) => {
        setPermissionDenied(err.toString());
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
    // if (initiator) {
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID, peer);
    // }

    return peer;
  }

  function handleRecieveCall(incoming) {
    console.log(incoming);
    let peer;
    const existingPeerObj = peersRef.current.find(
      (peerRef) => peerRef.peerID === incoming.callerID
    );

    console.log(existingPeerObj);
    if (existingPeerObj) {
      peer = existingPeerObj.peer;
    } else {
      peer = createPeer(incoming.callerID, false);
    }
    const desc = new RTCSessionDescription(incoming.signal);
    peer
      .setRemoteDescription(desc)
      .then(() => {
        const hasTaraks = peer
          .getSenders()
          .filter((sender) => sender.track !== null);
        console.log(hasTaraks);
        if (hasTaraks.length == 0) {
          // for check if the peer has tarck already to not add the same track twice
          if (shareScreenStreamRef.current) {
            shareScreenStreamRef.current
              .getTracks()
              .forEach((track) =>
                peer.addTrack(track, shareScreenStreamRef.current)
              );
          } else {
            clientStreamRef.current
              .getTracks()
              .forEach((track) =>
                peer.addTrack(track, clientStreamRef.current)
              );
          }
          if (newTrackForShareScreenRef.current) {
            newTrackForShareScreenRef.current
              .getTracks()
              .forEach((track) =>
                peer.addTrack(track, newTrackForShareScreenRef.current)
              );
          }
        }
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

    if (existingPeerObj) {
      const index = peersRef.current.findIndex(
        (peerObj) => peerObj.peerID === incoming.callerID
      );

      if (index !== -1) {
        peersRef.current[index].peer = peer;
        setPeers((peers) => {
          const updatedPeers = [...peers];
          if (updatedPeers[index]) updatedPeers[index].peer = peer;
          return updatedPeers;
        });
      }
    } else {
      peersRef.current.push({
        peerID: incoming.callerID,
        peer,
        isAdmin: incoming.isAdmin,
      });
      setPeers((peers) => [...peers, { isAdmin: incoming.isAdmin, peer }]);
    }
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
        shareScreenStreamRef.current ?? clientStreamRef.current // stream for new user
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
    if (shareScreenStreamRef.current) {
      shareScreenStreamRef.current?.getTracks()?.forEach((track) => {
        console.log(track);
        track.stop();
      });
    }
    history.push("/");
  }

  function handleForceMute() {
    setForceMuted(true);
  }

  function handleUnMute() {
    setForceMuted(false);
  }

  function handleForceCamOff() {
    setForceVideoStoped(true);
  }

  function handleCamOn() {
    setForceVideoStoped(false);
  }

  function handleStreamRemoved({ callerID, streamID }) {
    console.log({ callerID, streamID });
    setRemoveStreamObj({ callerID, streamID });
  }

  const addShareScreenWithNewTrack = () => {
    navigator.mediaDevices
      .getDisplayMedia({
        audio: true,
        video: true,
      })
      .then((newStream) => {
        newTrackForShareScreenRef.current = newStream;
        setIsShareScreenLayout(true);
        peersRef.current.forEach((peerObj) => {
          const coneectionState = peerObj.peer.connectionState;
          if (checkConnectionState(coneectionState)) {
            newStream.getTracks().forEach((track) => {
              peerObj.peer.addTrack(track, newStream);
            });
          }
        });
        newStream.getVideoTracks()[0].onended = stopShareScreenWithNewTrack;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const stopShareScreenWithNewTrack = () => {
    console.log(newTrackForShareScreenRef.current);
    newTrackForShareScreenRef.current
      .getTracks()
      .forEach((track) => track.stop());
    // need to remove track also
    socketRef.current.emit("remove-stream", {
      callerID: socketRef.current.id,
      streamID: newTrackForShareScreenRef.current.id,
    });
    newTrackForShareScreenRef.current = undefined;
    setIsShareScreenLayout(false);
  };

  return (
    <>
      <Modal
        centered
        onOk={() => {
          window.location.reload();
        }}
        okText="Retry"
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
        closable={false}
        title="Need Permissions"
        open={!!permissionDenied}
      >
        <p>You have to enable video and audio permission to use our app</p>
        {permissionDenied}
      </Modal>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
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
          {!isShareScreenLayout && (
            <Button
              type="primary"
              size="large"
              onClick={addShareScreenWithNewTrack}
            >
              Add Share Screen in new Track
            </Button>
          )}
          {isShareScreenLayout && (
            <Button
              type="primary"
              size="large"
              danger
              onClick={stopShareScreenWithNewTrack}
            >
              Stop Sharing
            </Button>
          )}
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
        {isShareScreenLayout && (
          <>
            <ShareScreen streamRef={newTrackForShareScreenRef} />
          </>
        )}
        <Container>
          <ClientVideo
            videoDeviceNotExist={videoDeviceNotExist}
            clientStreamRef={clientStreamRef}
            shareScreenStreamRef={shareScreenStreamRef}
            userVideo={userVideo}
            peers={peers}
            isAdmin={iAdmin}
            forceMuted={forceMuted}
            forceVideoStoped={forceVideoStoped}
            activeVideoDevice={activeVideoDevice}
            setActiveVideoDevice={setActiveVideoDevice}
            activeAudioDevice={activeAudioDevice}
            setActiveAudioDevice={setActiveAudioDevice}
          />

          {peers.map((peer, index) => {
            return (
              <Video
                id={peersRef.current[index].peerID}
                key={peersRef.current[index].peerID}
                peerObj={peer}
                iAdmin={iAdmin}
                socket={socketRef.current}
                setRemoveStreamObj={setRemoveStreamObj}
                removedStreamID={
                  removedStreamObj
                    ? peersRef.current[index].peerID ==
                      removedStreamObj.callerID
                      ? removedStreamObj.streamID
                      : false
                    : false
                }
              />
            );
          })}
        </Container>
      </div>
    </>
  );
};

export default Room;
