import {
  faDesktop,
  faCamera,
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
import { checkAudioDevices } from "../helpers/checkAudioDevices";

function ClientVideo({
  forceMuted,
  forceVideoStoped,
  userVideo,
  peers,
  clientStreamRef,
  setAyhamStream,
  isAdmin,
}) {
  const [video, setVideo] = useState(false);
  const [unMute, setUnMute] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [state, setState] = useState();
  const [initDone, setInitDone] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  useEffect(() => {
    setUnMute(!forceMuted && unMute);
  }, [forceMuted]);

  useEffect(() => {
    setVideo(!forceVideoStoped && video);
  }, [forceVideoStoped]);

  useEffect(() => {
    if (clientStreamRef.current && !initDone) {
      setInitDone(true);
      setVideo(!!clientStreamRef.current.getVideoTracks()[0]?.enabled);
      setUnMute(!!clientStreamRef.current.getAudioTracks()[0]?.enabled);
    }
  }, [clientStreamRef.current]);

  useEffect(() => {
    if (!video && clientStreamRef.current) {
      console.log(clientStreamRef.current.getVideoTracks());
      clientStreamRef.current.getVideoTracks().forEach((track) => (track.enabled = false));
      state?.getTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStreamRef.current?.getVideoTracks().forEach((track) => (track.enabled = true));
      state?.getTracks().forEach((track) => (track.enabled = true));
    }
  }, [video]);

  useEffect(() => {
    if (!unMute && clientStreamRef.current) {
      clientStreamRef.current.getAudioTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStreamRef.current?.getAudioTracks().forEach((track) => (track.enabled = true));
    }
  }, [unMute]);

  const setShareScreen = () => {
    if (!screenSharing && clientStreamRef.current) {
      navigator.mediaDevices
        .getDisplayMedia({
          audio: true,
          video: true,
        })
        .then((shareStreem) => {
          setAyhamStream(shareStreem);
          console.log(clientStreamRef.current.getTracks());
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
              peerObj.peer.addTrack(screenSharingTrack, clientStreamRef.current);
            }
          });
          // clientStreamRef.current = shareStreem;
          setState(shareStreem);
          console.log("clientStreamRef.current ref", clientStreamRef.current.getTracks());
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
    } else if (screenSharing && clientStreamRef.current) {
      endShareScreen();
    }
  };

  const endShareScreen = () => {
    console.log(clientStreamRef.current.getTracks());

    userVideo.current.srcObject = clientStreamRef.current;

    const vedioStreamTrack = clientStreamRef.current.getVideoTracks()[0];

    peers?.forEach((peerObj) => {
      const sender = peerObj.peer
        .getSenders()
        .find((s) => s.track.kind === "video");
      console.log(peerObj.peer.streams);
      console.log(clientStreamRef.current);
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



  function checkMultiCamera() {
    return navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        return ((videoDevices.length > 1));
      })
      .catch(error => {
        return (false);
      });
  }
  function switchCamera() {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        // console.log({ "devices": videoDevices })
        // console.log(clientStreamRef.current.getVideoTracks()[0].getSettings())
        const currentDeviceId = clientStreamRef.current.getVideoTracks()[0].getSettings().deviceId;
        console.log({ "currentDeviceId": currentDeviceId })
        let newDeviceId;

        for (let i = 0; i < videoDevices.length; i++) {
          if (videoDevices[i].deviceId !== currentDeviceId) {
            newDeviceId = videoDevices[i].deviceId;
            break;
          }
        }

        if (newDeviceId) {
          clientStreamRef.current.getTracks().forEach(track => track.stop());

          navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: newDeviceId },
              height: window.innerHeight / 2,
              width: window.innerWidth / 2,
            },
            audio: checkAudioDevices(),
          })
            .then(newStream => {
              clientStreamRef.current = newStream;
              userVideo.current.srcObject = newStream;
              // console.log({ "stream": newStream })
              // console.log({ "newStream.getVideoTracks()": newStream.getVideoTracks() })
              setAyhamStream(newStream);
              const newCameraTrack = newStream.getVideoTracks()[0];
              peers?.forEach((peerObj) => {
                const sender = peerObj.peer
                  .getSenders()
                  .find((s) => s?.track?.kind === "video");

                // console.log(sender);
                if (sender) {
                  sender.replaceTrack(newCameraTrack);
                } else {
                  peerObj.peer.addTrack(newCameraTrack, newStream);
                }
              });
            })

            .catch(error => {
              console.error('Error accessing new camera:', error);
            });
        } else {
          console.log('No other camera found.');
        }
      })
      .catch(error => {
        console.error('Error enumerating devices:', error);
      });
  }


  useEffect(() => {
    checkMultiCamera()
      .then(result => {
        setHasMultipleCameras(result);
      })
      .catch(error => {
        console.error('Error checking multiple cameras:', error);
      });
  }, []);

  // )}

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
        {hasMultipleCameras && (
          <button onClick={switchCamera}>
            <FontAwesomeIcon icon={faCamera} />
          </button>)}
      </div>
      <SoundVolumeMeter mediaStream={clientStreamRef.current} />
    </div>
  );
}

export default ClientVideo;
