import { Button, Col, Modal, Row, Spin } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import io from "socket.io-client";
import ClientVideo from "../Components/ClientVideo/ClientVideo";
import ControlBar from "../Components/ControlBar/ControlBar";
import Header from "../Components/Header/Header";
import PermissionsModal from "../Components/PermissionsModal/PermissionsModal";
import SettingsModal from "../Components/SettingsModal/SettingsModal";
import ShareScreen from "../Components/ShareScreen";
import Video from "../Components/Video";
import { iceConfig } from "../config/iceConfig";
import { createFakeVideoTrack } from "../helpers/createFakeVideoTrack";
import { getAvaliableUserMedia } from "../helpers/getAvaliableUserMedia";
import { getUserAgent } from "../helpers/getUserAgent";
import styles from "./styles.module.scss";
import userJoinsound from "../assets/sounds/user_joined.mp3";
import userLeavesound from "../assets/sounds/user_leave.mp3";

const Room = () => {
  const userJoinSoundRef = useRef(new Audio(userJoinsound));
  const userLeaveSoundRef = useRef(new Audio(userLeavesound));

  const socketRef = useRef();
  const userVideo = useRef();
  const clientStreamRef = useRef();
  const shareScreenStreamRef = useRef();
  const dataChannelsRef = useRef([]);
  const newTrackForLocalShareScreenRef = useRef();
  const newTrackForRemoteShareScreenRef = useRef();
  const peersRef = useRef([]);

  const [peers, setPeers] = useState([]);
  const [connectedPeer, setConnectedPeers] = useState({
    length: 0,
    failedUser: [""],
  });
  const connectedPeersRef = useRef(0);

  const [iAdmin, setIAdmin] = useState(false);
  const [forceMuted, setForceMuted] = useState(false);
  const [forceVideoStoped, setForceVideoStoped] = useState(false);
  const [adminMuteAll, setAdminMuteAll] = useState(false);
  const [adminStopCamAll, setAdminStopCamAll] = useState(false);
  const [activeVideoDevice, setActiveVideoDevice] = useState(null);
  const [activeAudioDevice, setActiveAudioDevice] = useState(null);
  const [videoDeviceNotExist, setVideoDeviceNotExist] = useState(false);
  const [removedStreamObj, setRemoveStreamObj] = useState();
  const [shareScreenMode, setShareScreenMode] = useState({
    owner: false,
    streamId: null,
  });
  const [settingsModalOpen, setSettingModalOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState();
  const [unMute, setUnMute] = useState(false);
  const [video, setVideo] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connectionFailedReason, setConnectionFailedReason] = useState();
  // const [fireCheckState, setFireCheckState] = useState(false);
  const [loading, setLoading] = useState(true);

  const history = useHistory();
  const { roomID, userName } = useParams();

  async function ByForce() {
    let baseUrl;

    if (process.env.NODE_ENV === "production") {
      baseUrl = "https://yorkbritishacademy.net/";
    } else {
      baseUrl = "http://localhost:3001";
    }
    // baseUrl = "https://yorkbritishacademy.net/";

    socketRef.current = io.connect(baseUrl);

    getAvaliableUserMedia()
      .then((stream) => {
        setLoading(true);
        if (stream.getVideoTracks()[0]) {
          stream.getVideoTracks()[0].enabled = false;
          setActiveVideoDevice(
            stream.getVideoTracks()[0].getSettings().deviceId
          );
        } else {
          const fakeVideoTrack = createFakeVideoTrack();

          stream.addTrack(fakeVideoTrack);
          setVideoDeviceNotExist(true);
        }
        if (stream.getAudioTracks()[0]) {
          setActiveAudioDevice(
            stream.getAudioTracks()[0].getSettings().deviceId
          );
        }

        clientStreamRef.current = stream;

        userVideo.current.srcObject = clientStreamRef.current;

        setPermissionDenied(false);

        socketRef.current.emit("join room", {
          roomID,
          userName,
          voice_bool: true, // should ask user for state
          video_bool: false, // should ask user for state
          userAgent: getUserAgent(),
        });

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

        socketRef.current.on("share-screen-mode", handleShareScreenMode);

        socketRef.current.on(
          "share-screen-mode-stop",
          handleShareScreenModeStop
        );
      })

      .catch((err) => {
        setPermissionDenied(err.toString());
        console.error(err);
      });
  }

  useEffect(() => {
    ByForce();

    return () => {
      clientStreamRef.current?.getTracks()?.forEach((track) => {
        track.stop();
      });
      if (shareScreenStreamRef.current) {
        shareScreenStreamRef.current?.getTracks()?.forEach((track) => {
          track.stop();
        });
      }
      if (newTrackForLocalShareScreenRef.current) {
        newTrackForLocalShareScreenRef.current
          ?.getTracks()
          ?.forEach((track) => {
            track.stop();
          });
      }
      if (newTrackForLocalShareScreenRef.current) {
        console.log("emit");
        socketRef.current.emit("remove-stream", {
          callerID: socketRef.current.id,
          streamID: newTrackForLocalShareScreenRef.current.id,
        });
        socketRef.current.emit("stop-share-screen");
      }
      socketRef.current.disconnect();
    };
  }, []);

  function callUser(userID, socket_id, clientStream) {
    const peer = createPeer(userID, true);
    dataChannelsRef.current.push({
      id: userID,
      dataChannel: Create_DataChannel(socket_id, peer),
    });
    clientStream
      .getTracks()
      .forEach((track) => peer.addTrack(track, clientStream));

    return peer;
  }

  function createPeer(userID, initiator) {
    const peer = new RTCPeerConnection(iceConfig);

    peer.onicecandidate = (e) => handleICECandidateEvent(e, userID);
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID, peer);

    return peer;
  }

  function handleRecieveCall(incoming) {
    let peer;
    const existingPeerObj = peersRef.current.find(
      (peerRef) => peerRef.peerID === incoming.callerID
    );

    if (existingPeerObj) {
      peer = existingPeerObj.peer;
    } else {
      peer = createPeer(incoming.callerID, false);
      userJoinSoundRef.current.volume = 0.4;
      userJoinSoundRef.current.play();
    }
    const desc = new RTCSessionDescription(incoming.signal);
    peer
      .setRemoteDescription(desc)
      .then(() => {
        const hasTaraks = peer
          .getSenders()
          .filter((sender) => sender.track !== null);
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
          if (newTrackForLocalShareScreenRef.current) {
            newTrackForLocalShareScreenRef.current
              .getTracks()
              .forEach((track) =>
                peer.addTrack(track, newTrackForLocalShareScreenRef.current)
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
      const peerObj = {
        peerID: incoming.callerID,
        isAdmin: incoming.isAdmin,
        voice: incoming.voice,
        video: incoming.video,
        userName: incoming.userName,
        userAgent: incoming.userAgent,
        peer,
      };
      peersRef.current.push(peerObj);
      setPeers((peers) => [...peers, peerObj]);
    }
  }

  function handleAnswer(message) {
    const desc = new RTCSessionDescription(message.signal);
    const item = peersRef.current.find(
      (peerRef) => peerRef.peerID === message.id
    );

    item.peer.setRemoteDescription(desc).catch((e) => console.error(e));
  }

  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming.candidate);
    const item = peersRef.current.find(
      (peerRef) => peerRef.peerID === incoming.id
    );
    item.peer
      .addIceCandidate(candidate)
      .then(() => {
        // console.log("new Ice", incoming, item.peer.connectionState);
      })
      .catch((e) => console.error(e));
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
        .catch((e) => console.error(e));
    }
  }

  function handleICECandidateEvent(e, userId) {
    if (e?.candidate) {
      const item = peersRef.current.find(
        (peerRef) => peerRef.peerID === userId
      );
      // console.log("onicecandidate", e, item.peer.connectionState);
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
      setLoading(false);
      setIAdmin(true);
    } else {
      users.forEach((remotePeer) => {
        //user id is the old socket_id already in room
        const peer = callUser(
          remotePeer.id, // the old user socket id
          socketRef.current.id, // new user socket id
          shareScreenStreamRef.current ?? clientStreamRef.current // stream for new user
        );
        // the peer is the peer of the new user
        const peerObj = {
          peerID: remotePeer.id,
          isAdmin: remotePeer.isAdmin,
          voice: remotePeer.voice,
          video: remotePeer.video,
          userName: remotePeer.userName,
          userAgent: remotePeer.userAgent,
          peer,
        };
        peersRef.current.push(peerObj);
        peers.push(peerObj);
      });
      setPeers(peers);
      // setFireCheckState(true);
    }
  }

  function handleUserLeave(userID) {
    const removedPeer = peersRef.current.filter(
      (peer) => peer.peerID === userID
    );
    const newPeers = peersRef.current.filter((peer) => peer.peerID !== userID);

    removedPeer[0]?.peer.close();
    peersRef.current = newPeers;
    setPeers(
      peersRef.current.map((peerObj) => {
        return {
          ...peerObj,
        };
      })
    );
    setConnectedPeers({ failedUser: [""], length: connectedPeersRef.current });
    userLeaveSoundRef.current.play();
    console.log("user leave", userID);
    console.log("removedPeer", removedPeer);
    console.log("newPeers", newPeers);
  }

  function handleForceLeave() {
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

  function handleShareScreenMode({ ownerID, streamID }) {
    setShareScreenMode({ owner: false, streamId: streamID });
  }

  function handleShareScreenModeStop() {
    setShareScreenMode({ owner: false, streamId: null });
    newTrackForRemoteShareScreenRef.current = undefined;
  }

  function Create_DataChannel(name, peer) {
    const dataChannelOptions = {
      ordered: false, // do not guarantee order
      maxPacketLifeTime: 3000, // in milliseconds
    };

    var channelname = name;
    const Send_dataChannel = peer.createDataChannel(
      channelname,
      dataChannelOptions
    );
    console.log("Created DataChannel dataChannel = " + Send_dataChannel);

    return Send_dataChannel;
  }

  useEffect(() => {
    console.log(connectedPeer);
    if (connectedPeer.length === peers.length) {
      setLoading(false);
    } else if (connectedPeer.length === -1) {
      setConnectionFailedReason(
        `your connection is failed with ${connectedPeer.failedUser
          .join(" - ")
          .toString()}`
      );
      setLoading(false);
    }
  }, [connectedPeer]);

  //By Chat gpt
  // useEffect(() => {
  //   if (loading && fireCheckState && peers) {
  //     // Create an object to store counters for each peer

  //     checkAllPeersConnectionState({
  //       counters: {},
  //       peers,
  //       setConnectionFailedReason,
  //       setFireCheckState,
  //       setLoading,
  //     }); // Call the function initially
  //   }
  // }, [fireCheckState, peers]);

  return (
    <>
      <Modal
        open={connectionFailedReason}
        okText={"Reload"}
        cancelText={"ignore"}
        onOk={() => {
          window.location.reload();
        }}
        onCancel={() => {
          setConnectionFailedReason(undefined);
        }}
      >
        {connectionFailedReason}
      </Modal>
      <SettingsModal
        adminMuteAll={adminMuteAll}
        adminStopCamAll={adminStopCamAll}
        iAdmin={iAdmin}
        setAdminMuteAll={setAdminMuteAll}
        setAdminStopCamAll={setAdminStopCamAll}
        setSettingModalOpen={setSettingModalOpen}
        settingsModalOpen={settingsModalOpen}
        socketRef={socketRef}
      />
      <PermissionsModal permissionDenied={permissionDenied} />
      <Spin spinning={loading}>
        <div className={styles.container}>
          <Header peers={peers} />

          <Row
            gutter={[15, 0]}
            justify={"center"}
            align={"middle"}
            className={styles.framesContainer}
          >
            {shareScreenMode.streamId && (
              <Col xs={24}>
                <ShareScreen
                  owner={shareScreenMode.owner}
                  streamRef={
                    newTrackForRemoteShareScreenRef.current
                      ? newTrackForRemoteShareScreenRef
                      : newTrackForLocalShareScreenRef
                  }
                />
              </Col>
            )}
            <Col xs={24} md={12} lg={12} xl={8} xxl={6}>
              <ClientVideo
                userName={userName}
                userVideo={userVideo}
                peers={peers}
                clientStreamRef={clientStreamRef}
                isAdmin={iAdmin}
                activeAudioDevice={activeAudioDevice}
                activeVideoDevice={activeVideoDevice}
                setActiveVideoDevice={setActiveVideoDevice}
                setActiveAudioDevice={setActiveAudioDevice}
                screenSharing={screenSharing}
                video={video}
              />
            </Col>
            {peers.map((peer, index) => {
              return (
                <Col
                  xs={24}
                  md={12}
                  lg={12}
                  xl={8}
                  xxl={6}
                  key={peersRef.current[index].peerID}
                >
                  <Video
                    connectedPeersRef={connectedPeersRef}
                    peersRef={peersRef}
                    setConnectedPeers={setConnectedPeers}
                    setPeers={setPeers}
                    dataChannelsRef={dataChannelsRef}
                    newTrackForRemoteShareScreenRef={
                      newTrackForRemoteShareScreenRef
                    }
                    shareScreenStreamId={shareScreenMode.streamId}
                    setShareScreenMode={setShareScreenMode}
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
                </Col>
              );
            })}
          </Row>
          <ControlBar
            setVideoDeviceNotExist={setVideoDeviceNotExist}
            peersRef={peersRef}
            setShareScreenMode={setShareScreenMode}
            newTrackForLocalShareScreenRef={newTrackForLocalShareScreenRef}
            clientStreamRef={clientStreamRef}
            setSettingModalOpen={setSettingModalOpen}
            settingsModalOpen={settingsModalOpen}
            shareScreenMode={shareScreenMode}
            socketRef={socketRef}
            dataChannelsRef={dataChannelsRef}
            forceMuted={forceMuted}
            forceVideoStoped={forceVideoStoped}
            iAdmin={iAdmin}
            peers={peers}
            shareScreenStreamRef={shareScreenStreamRef}
            userVideo={userVideo}
            videoDeviceNotExist={videoDeviceNotExist}
            screenSharing={screenSharing}
            setScreenSharing={setScreenSharing}
            setUnMute={setUnMute}
            setVideo={setVideo}
            unMute={unMute}
            video={video}
            activeAudioDevice={activeAudioDevice}
            activeVideoDevice={activeVideoDevice}
            setActiveAudioDevice={setActiveAudioDevice}
            setActiveVideoDevice={setActiveVideoDevice}
          />
        </div>
      </Spin>
    </>
  );
};

export default Room;
