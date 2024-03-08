import {
  faDesktop,
  faMicrophoneSlash,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import img from "../assets/test.png";
import styles from "./styles.module.css";
import { isMobileDevice } from "../helpers/isMobileDevice";
import { Button } from "antd";
function ClientVideo({ userVideo, peers, clientStream, setAyhamStream }) {
  const [video, setVideo] = useState(false);
  const [mute, setMute] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [state, setState] = useState();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    if (clientStream && !initDone) {
      setInitDone(true);
      setVideo(!!clientStream.getVideoTracks()[0]?.enabled);
      setMute(!!clientStream.getAudioTracks()[0]?.enabled);
    }
  }, [clientStream]);

  useEffect(() => {
    if (!video && clientStream) {
      console.log(clientStream.getVideoTracks());
      clientStream.getVideoTracks().forEach((track) => (track.enabled = false));
      state?.getTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStream?.getVideoTracks().forEach((track) => (track.enabled = true));
      state?.getTracks().forEach((track) => (track.enabled = true));
    }
  }, [video]);

  useEffect(() => {
    if (!mute && clientStream) {
      clientStream.getAudioTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStream?.getAudioTracks().forEach((track) => (track.enabled = true));
    }
  }, [mute]);

  const setShareScreen = () => {
    if (!screenSharing && clientStream) {
      navigator.mediaDevices
        .getDisplayMedia({
          audio: true,
          video: true,
        })
        .then((shareStreem) => {
          setAyhamStream(shareStreem);
          console.log(clientStream.getTracks());
          // setClientStream(shareStreem);
          userVideo.current.srcObject = shareStreem;
          const screenSharingTrack = shareStreem.getVideoTracks()[0];
          peers?.forEach((peer) => {
            const sender = peer
              .getSenders()
              .find((s) => s?.track?.kind === "video");

            console.log(sender);
            if (sender) {
              sender.replaceTrack(screenSharingTrack);
            } else {
              peer.addTrack(screenSharingTrack, clientStream);
            }
          });
          // clientStream = shareStreem;
          setState(shareStreem);
          console.log("clientStream ref", clientStream.getTracks());
          setScreenSharing(true);
          setVideo(true);
          screenSharingTrack.onended = () => {
            endShareScreen();
          };
        })
        .catch((e) => {
          console.log(e);
          // setMute(false);
          // setVideo(false);
        });
    } else if (screenSharing && clientStream) {
      endShareScreen();
    }
  };

  const endShareScreen = () => {
    console.log(clientStream.getTracks());

    userVideo.current.srcObject = clientStream;

    const vedioStreamTrack = clientStream.getVideoTracks()[0];

    peers?.forEach((peer) => {
      const sender = peer.getSenders().find((s) => s.track.kind === "video");
      console.log(peer.streams);
      console.log(clientStream);
      sender.replaceTrack(vedioStreamTrack);
    });
    state?.getTracks().forEach((track) => track.stop());
    setScreenSharing(false);
  };

  useEffect(() => {
    return () => {
      state?.getTracks().forEach((track) => track.stop());
    };
  }, [state]);

  return (
    <div className={styles.videoFrame}>
      <video
        className={styles.video}
        src={img}
        muted
        ref={userVideo}
        autoPlay
        playsInline
        style={
          !screenSharing
            ? {
                transform: "scaleX(-1)",
              }
            : {}
        }
      />

      {!video && <img src={img} className={styles.alt} />}
      <div className={styles.acitons}>
        <Button type="text" className={styles.button}>
          <FontAwesomeIcon
            onClick={() => setMute(!mute)}
            className={`${styles.icon} ${!mute && styles.danger}`}
            icon={faMicrophoneSlash}
          />
        </Button>
        <Button type="text" className={styles.button}>
          <FontAwesomeIcon
            onClick={() => setVideo(!video)}
            className={`${styles.icon} ${!video && styles.danger}`}
            icon={faVideoSlash}
          />
        </Button>
        {!isMobileDevice() && (
          <Button type="text" className={styles.button}>
            <FontAwesomeIcon
              onClick={() => setShareScreen()}
              className={`${styles.icon} ${screenSharing && styles.active}`}
              icon={faDesktop}
            />
          </Button>
        )}
      </div>
    </div>
  );
}

export default ClientVideo;
