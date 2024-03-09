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
import { Button, Tag } from "antd";
import SoundVolumeMeter from "./SoundMeter";

function ClientVideo({
  forceMuted,
  forceVideoStoped,
  userVideo,
  peers,
  clientStream,
  setAyhamStream,
  isAdmin,
}) {
  const [video, setVideo] = useState(false);
  const [unMute, setUnMute] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [state, setState] = useState();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    setUnMute(!forceMuted && unMute);
  }, [forceMuted]);

  useEffect(() => {
    setVideo(!forceVideoStoped && video);
  }, [forceVideoStoped]);

  useEffect(() => {
    if (clientStream && !initDone) {
      setInitDone(true);
      setVideo(!!clientStream.getVideoTracks()[0]?.enabled);
      setUnMute(!!clientStream.getAudioTracks()[0]?.enabled);
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
    if (!unMute && clientStream) {
      clientStream.getAudioTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStream?.getAudioTracks().forEach((track) => (track.enabled = true));
    }
  }, [unMute]);

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
          peers?.forEach((peerObj) => {
            const sender = peerObj.peer
              .getSenders()
              .find((s) => s?.track?.kind === "video");

            console.log(sender);
            if (sender) {
              sender.replaceTrack(screenSharingTrack);
            } else {
              peerObj.peer.addTrack(screenSharingTrack, clientStream);
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

    peers?.forEach((peerObj) => {
      const sender = peerObj.peer
        .getSenders()
        .find((s) => s.track.kind === "video");
      console.log(peerObj.peer.streams);
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
      {isAdmin && (
        <div className={styles.tagContainer}>
          <Tag className={styles.tag} color="#f50">
            Admin
          </Tag>
        </div>
      )}
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
        <Button
          style={{
            opacity: forceMuted ? 0.5 : 1,
          }}
          type="text"
          disabled={forceMuted}
          className={styles.button}
        >
          <FontAwesomeIcon
            onClick={() => {
              if (!forceMuted) setUnMute(!unMute);
            }}
            className={`${styles.icon} ${!unMute && styles.danger}`}
            icon={faMicrophoneSlash}
          />
        </Button>
        <Button
          type="text"
          disabled={forceVideoStoped}
          className={styles.button}
          style={{
            opacity: forceVideoStoped ? 0.5 : 1,
          }}
        >
          <FontAwesomeIcon
            onClick={() => {
              if (!forceVideoStoped) setVideo(!video);
            }}
            className={`${styles.icon} ${!video && styles.danger}`}
            icon={faVideoSlash}
          />
        </Button>
        {!isMobileDevice() && (
          <Button
            disabled={forceVideoStoped}
            type="text"
            className={styles.button}
            style={{
              opacity: forceVideoStoped ? 0.5 : 1,
            }}
          >
            <FontAwesomeIcon
              onClick={() => {
                if (!forceVideoStoped) setShareScreen();
              }}
              className={`${styles.icon} ${screenSharing && styles.active}`}
              icon={faDesktop}
            />
          </Button>
        )}
      </div>
      <SoundVolumeMeter mediaStream={clientStream} />
    </div>
  );
}

export default ClientVideo;
