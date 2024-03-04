import {
  faDesktop,
  faMicrophoneSlash,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import img from "../assets/test.png";
import styles from "./styles.module.css";

function ClientVideo({
  userVideo,
  peers,
  clientStream,
}) {
  const [video, setVideo] = useState(false);
  const [mute, setMute] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  useEffect(() => {
    if (clientStream) {
      setVideo(!!clientStream.getVideoTracks()[0]?.enabled);
      setMute(!!clientStream.getAudioTracks()[0]?.enabled);
    }
  }, [clientStream]);

  useEffect(() => {
    if (!video && clientStream) {
      clientStream.getVideoTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStream?.getVideoTracks().forEach((track) => (track.enabled = true));
    }
  }, [video]);

  useEffect(() => {
    if (!mute && clientStream) {
      clientStream.getAudioTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStream?.getAudioTracks().forEach((track) => (track.enabled = true));
    }
  }, [mute]);

  useEffect(() => {
    if (screenSharing && clientStream) {
      navigator.mediaDevices
        .getDisplayMedia({
          audio: true,
          video: true,
        })
        .then((shareStreem) => {
          // setClientStream(shareStreem);
          userVideo.current.srcObject = shareStreem;
          const screenSharingTrack = shareStreem.getVideoTracks()[0];
          peers?.forEach((peer) => {
            console.log(peer.streams[0].getVideoTracks()[0]);
            peer.replaceTrack(
              peer.streams[0].getVideoTracks()[0],
              screenSharingTrack,
              clientStream
            );
          });
          clientStream = shareStreem;
          console.log(clientStream);
        })
        .catch((e) => console.log(e));
    } else if (!screenSharing && clientStream) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then((vedioStream) => {
          // setClientStream(vedioStream);
          userVideo.current.srcObject = vedioStream;
          const vedioStreamTrack = vedioStream.getVideoTracks()[0];
          peers?.forEach((peer) => {
            console.log(peer.streams);
            console.log(clientStream);
            peer.replaceTrack(
              peer.streams[0].getVideoTracks()[0],
              vedioStreamTrack,
              clientStream
            );
          });
          clientStream = vedioStream;
          console.log(clientStream);
        })
        .catch((e) => console.log(e));
    }
  }, [screenSharing]);

  return (
    <div className={styles.videoFrame}>
      <video
        className={styles.video}
        src={img}
        muted
        ref={userVideo}
        autoPlay
        playsInline
      />

      {!video && <img src={img} className={styles.alt} />}

      <div className={styles.acitons}>
        <FontAwesomeIcon
          onClick={() => setMute(!mute)}
          className={`${styles.icon} ${!mute && styles.danger}`}
          icon={faMicrophoneSlash}
        />
        <FontAwesomeIcon
          onClick={() => setVideo(!video)}
          className={`${styles.icon} ${!video && styles.danger}`}
          icon={faVideoSlash}
        />
        <FontAwesomeIcon
          onClick={() => setScreenSharing(!screenSharing)}
          className={`${styles.icon} ${screenSharing && styles.active}`}
          icon={faDesktop}
        />
      </div>
    </div>
  );
}

export default ClientVideo;
