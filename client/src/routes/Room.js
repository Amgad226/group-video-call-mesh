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
  const partnerVideo = useRef();

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

        // socketRef.current.on("all users", (users) => {
        //   const peers = [];
        //   // create peer connection for each user for me
        //   console.log(clientStreamRef.current);
        //   users.forEach((userID) => {
        //     //user id is the old socket_id already in room
        //     const peer = createPeer(
        //       userID, // the old user socket id
        //       socketRef.current.id, // new user socket id
        //       clientStreamRef.current // stream for new user
        //     );
        //     // the peer is the peer of the new user

        //     peersRef.current.push({
        //       peerID: userID,
        //       peer,
        //     });
        //     peers.push(peer);
        //   });
        //   setPeers(peers);
        // });

        // socketRef.current.on("user joined", (payload) => {
        //   // payload
        //   // signal: payload.signal, //new user SDP
        //   // callerID: payload.callerID, // new_user_socket_id

        //   console.log(payload); // {SDP for new user,new_user_socket_id}
        //   console.log(clientStreamRef.current);

        //   const peer = addPeer(
        //     payload.signal, //SPD for new user
        //     payload.callerID, // socket id (new user for room)
        //     clientStreamRef.current // stream for new user
        //   );
        //   peersRef.current.push({
        //     peerID: payload.callerID,
        //     peer,
        //   });
        //   setPeers((users) => [...users, peer]);
        // });
        // socketRef.current.on("receiving returned signal", (payload) => {
        //   const item = peersRef.current.find((p) => p.peerID === payload.id);
        //   item.peer.signal(payload.signal);
        //   // NOTE :here must remove the old peer form peers array and may in peerRef and may add the new peer
        // });
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
    const peer = createPeer(userID);
    clientStream
      .getTracks()
      .forEach((track) => peer.addTrack(track, clientStream));

    return peer;
  }

  function createPeer(userID) {
    const peer = new RTCPeerConnection(iceConfig);

    peer.onicecandidate = (e) => handleICECandidateEvent(e, userID);
    // peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID, peer);

    return peer;
  }

  function handleRecieveCall(incoming) {
    const peer = createPeer();
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
    item.peer.addIceCandidate(candidate).catch((e) => console.log(e));
  }

  function handleNegotiationNeededEvent(userID, peer) {
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

  function handleICECandidateEvent(e, userId) {
    if (e?.candidate) {
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
    // setPeers(newPeers.map((peer) => peer.peer));
    peersRef.current = newPeers;
    setPeers(peersRef.current.map((peer) => peer.peer));
  }

  //   socketRef?.current?.on("user-leave", (e) => {
  //     console.log("user leave", e, peersRef.current, peers);
  //   });

  //   useEffect(() => {
  //     socketRef.current.on("user-leave", (e) => {
  //       console.log("user leave", e, peersRef.current, peers);
  //     });
  //   } , []);

  // function createPeer(userToSignal, callerID, stream) {
  //   // userToSignal :old user socket id
  //   // callerID :new user socket id
  //   // stream

  //   /**
  //        This line creates a new instance of the Peer class.
  //         The initiator property is set to true, indicating that this peer will initiate the connection.
  //         trickle is set to false, which means ICE candidates won't be sent until the peer connection is fully established.
  //         stream is a media stream that this peer will send to other peers.
  //        config is an optional parameter containing ICE server configuration.
  //        */
  //   console.log("from create peer", clientStreamRef.current?.getTracks());

  //   const peer = new Peer({
  //     initiator: true,
  //     trickle: false,
  //     stream: ayhamStram ?? stream,
  //     config: iceConfig,
  //   });
  //   console.log(peer);

  //   // This line sets up an event listener for the "signal" event emitted by the peer object.
  //   //  When the peer generates a signaling message (e.g., an SDP offer or answer),
  //   // this event will be triggered,
  //   //  and the provided callback function will be executed.
  //   //  Inside this callback, the signaling message (signal) is passed as an argument.
  //   peer.on("signal", (signal) => {
  //     socketRef.current.emit("sending signal", {
  //       userToSignal, // any user_socket_id in room (old user in room)
  //       callerID, // my socket id (new user for room)
  //       signal, // may be have the sdp offer or answer for new user
  //     });
  //   });
  //   peer.on("error", (err) => {
  //     console.log(err);
  //   });
  //   peer.on("end", (err) => {
  //     console.log(err);
  //   });
  //   peer.on("close", (err) => {
  //     console.log(err);
  //   });
  //   peer.on("pause", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("error", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("end", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("close", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("pause", (err) => {
  //     console.log(err);
  //   });
  //   peer._destroy = () => {};

  //   return peer;
  // }

  //you can specify a STUN server here
  // const iceConfiguration = iceConfig;

  // const localConnection = new RTCPeerConnection(iceConfiguration);

  // localConnection.onnceicecandidate = (e) => {
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

  // function addPeer(incomingSignal, callerID, stream) {
  //   // incomingSignal :SPD for new user
  //   // callerID :socket id for new user
  //   // stream
  //   console.log("from add peer", ayhamStram?.getTracks());
  //   console.log("from add peer", clientStreamRef.current?.getTracks());

  //   const peer = new Peer({
  //     initiator: false,
  //     trickle: false,
  //     stream: ayhamStram ?? stream,
  //     config: iceConfig,
  //   });

  //   peer.on("signal", (signal) => {
  //     //signal is the SDP for old user
  //     socketRef.current.emit("returning signal", { signal, callerID });
  //   });
  //   peer.on("error", (err) => {
  //     console.log(err);
  //   });
  //   peer.on("end", (err) => {
  //     console.log(err);
  //   });
  //   peer.on("close", (err) => {
  //     console.log(err);
  //   });
  //   peer.on("pause", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("error", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("end", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("close", (err) => {
  //     console.log(err);
  //   });
  //   peer.once("pause", (err) => {
  //     console.log(err);
  //   });
  //   peer._destroy = () => {};

  //   peer.signal(incomingSignal);

  //   return peer;
  // }

  // useEffect(() => {
  //   console.log("ayham", ayhamStram?.getTracks());
  // }, [ayhamStram]);

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
            // localConnection={localConnection}
            peers={peers}
          />
          {/* <video
            style={{ width: 300, height: 300 }}
            autoPlay
            ref={partnerVideo}
          /> */}
          {peers.map((peer, index) => {
            return <Video key={peersRef.current[index].peerID} peer={peer} />;
          })}
        </Container>
      </div>
    </>
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
