import {
  faDesktop,
  faCamera,
  faMicrophoneSlash,
  faVideoSlash,
  faExchangeAlt,
  faGears,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import img from "../assets/test.png";
import styles from "./styles.module.css";
import { isMobileDevice } from "../helpers/isMobileDevice";
import { Button, Tag } from "antd";
import SoundVolumeMeter from "./SoundMeter";
import DeviceSelectionModal from "./DeviceSelectionModal";
import { getAvaliableUserMedia } from "../helpers/getAvaliableUserMedia";
import { createFakeVideoTrack } from "../helpers/createFakeVideoTrack";
function ClientVideo({
  videoDeviceNotExist,
  forceMuted,
  forceVideoStoped,
  userVideo,
  peers,
  clientStreamRef,
  setAyhamStream,
  isAdmin,
  activeVideoDevice,
  setActiveVideoDevice,
  activeAudioDevice,
  setActiveAudioDevice,
}) {
  const [showModal, setShowModal] = useState(false);
  const [video, setVideo] = useState(false);
  const [unMute, setUnMute] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [state, setState] = useState();
  const [initDone, setInitDone] = useState(false);
  const [hasMultipleDevices, setHasMultipleDevices] = useState(false);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const organizedDevices = {};
        mediaDevices.forEach((device) => {
          const { kind, deviceId, label } = device;

          if (!organizedDevices[kind]) {
            organizedDevices[kind] = [];
          }
          organizedDevices[kind].push({ deviceId, label, kind });
        });

        setDevices(organizedDevices);
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };
    fetchDevices();
  }, []);

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
      clientStreamRef.current
        .getVideoTracks()
        .forEach((track) => (track.enabled = false));
      state?.getTracks().forEach((track) => (track.enabled = false));
    } else {
      clientStreamRef.current
        ?.getVideoTracks()
        .forEach((track) => (track.enabled = true));
      state?.getTracks().forEach((track) => (track.enabled = true));
    }
  }, [video]);

  useEffect(() => {
    if (!unMute && clientStreamRef.current) {
      clientStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = false));
    } else {
      clientStreamRef.current
        ?.getAudioTracks()
        .forEach((track) => (track.enabled = true));
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
          userVideo.current.srcObject = shareStreem;
          clientStreamRef.current = shareStreem;
          const screenSharingTrack = shareStreem.getVideoTracks()[0];
          peers?.forEach((peerObj) => {
            const sender = peerObj.peer
              .getSenders()
              .find((s) => s?.track?.kind === "video");

            console.log(sender);
            if (sender) {
              sender.replaceTrack(screenSharingTrack);
            } else {
              // peerObj.peer.addTrack(
              //   screenSharingTrack,
              //   clientStreamRef.current
              // );
            }
          });
          setState(shareStreem);
          console.log(
            "clientStreamRef.current ref",
            clientStreamRef.current.getTracks()
          );
          setScreenSharing(true);
          setVideo(true);
          screenSharingTrack.onended = () => {
            endShareScreen();
          };
        })
        .catch((e) => {
          console.log(e);
        });
    } else if (screenSharing && clientStreamRef.current) {
      endShareScreen();
    }
  };

  const endShareScreen = () => {
    getAvaliableUserMedia().then((stream) => {
      clientStreamRef.current = stream;
      userVideo.current.srcObject = stream;
      peers?.forEach((peerObj) => {
        const sender = peerObj.peer
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (stream.getVideoTracks()[0]) {
          sender.replaceTrack(stream.getVideoTracks()[0]);
        } else {
          const fakeVideoTrack = createFakeVideoTrack();
          sender.replaceTrack(fakeVideoTrack);
        }
      });
      state?.getTracks().forEach((track) => track.stop());
      setScreenSharing(false);
      setVideo(false);
    });
  };

  useEffect(() => {
    return () => {
      state?.getTracks().forEach((track) => track.stop());
    };
  }, [state]);

  const checkMultiDevices = () => {
    return navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );
        return videoDevices.length > 1 || audioDevices.length > 1
          ? true
          : false;
      })
      .catch((error) => {
        return false;
      });
  };

  const switchDevice = (deviceId, kind) => {
    if (kind == "videoinput") {
      clientStreamRef.current.getVideoTracks().forEach((track) => track.stop());

      getVideoStreamByDeviceId(deviceId)
        .then((newStream) => {
          const merge = new MediaStream([
            ...clientStreamRef.current.getAudioTracks(),
            ...newStream.getVideoTracks(),
          ]);
          newStream = merge;
          userVideo.current.srcObject = newStream;
          clientStreamRef.current = newStream;
          setActiveVideoDevice(deviceId);

          setAyhamStream(newStream);

          peers?.forEach((peerObj) => {
            const senderV = peerObj.peer
              .getSenders()
              .find((s) => s?.track?.kind === "video");
            senderV.replaceTrack(newStream.getVideoTracks()[0]);
          });
        })
        .catch((error) => {
          alert("can not swatch camera");
          console.error("Error accessing new camera:", error);
        });
    } else if (kind == "audioinput") {
      clientStreamRef.current.getAudioTracks().forEach((track) => track.stop());
      getAudioStreamByDeviceId(deviceId)
        .then((newStream) => {
          const merge = new MediaStream([
            ...clientStreamRef.current.getVideoTracks(),
            ...newStream.getAudioTracks(),
          ]);
          newStream = merge;
          userVideo.current.srcObject = newStream;
          clientStreamRef.current = newStream;
          setActiveAudioDevice(deviceId);

          setAyhamStream(newStream);

          peers?.forEach((peerObj) => {
            const senderV = peerObj.peer
              .getSenders()
              .find((s) => s?.track?.kind === "audio");
            senderV.replaceTrack(newStream.getAudioTracks()[0]);
          });
        })
        .catch((error) => {
          alert("can not swatch audio device");
          console.error("Error accessing in switch audio device:", error);
        });
    } else {
      alert("unsupported device kind :" + kind);
      console.log("unsupported device kind :" + kind);
    }
  };

  const findNewVideoDeviceId = (videoDevices, currentDeviceId) => {
    for (let i = 0; i < videoDevices.length; i++) {
      if (videoDevices[i].deviceId !== currentDeviceId) {
        return videoDevices[i].deviceId;
      }
    }
    return false;
  };
  const getVideoStreamByDeviceId = (deviceId) => {
    return navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        height: window.innerHeight / 2,
        width: window.innerWidth / 2,
      },
      audio: true,
    });
  };
  const getAudioStreamByDeviceId = (deviceId) => {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
      },
    });
  };
  useEffect(() => {
    checkMultiDevices()
      .then((result) => {
        setHasMultipleDevices(result);
      })
      .catch((error) => {
        console.error("Error checking multiple cameras:", error);
      });
  }, []);

  const handleDeviceSelect = (device) => {
    switchDevice(device.deviceId, device.kind);
    setShowModal(false);
  };

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

      {!video && !screenSharing && <img src={img} className={styles.alt} />}
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
          disabled={(forceVideoStoped || videoDeviceNotExist) && !screenSharing}
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

        <>
          {hasMultipleDevices && (
            <>
              <div onClick={() => setShowModal(true)}>
                <FontAwesomeIcon icon={faGears} className={`${styles.icon} `} />
              </div>
              <DeviceSelectionModal
                showModal={showModal}
                setShowModal={setShowModal}
                handleDeviceSelect={handleDeviceSelect}
                devices={devices}
                activeVideoDevice={activeVideoDevice}
                setActiveVideoDevice={setActiveVideoDevice}
                activeAudioDevice={activeAudioDevice}
                setActiveAudioDevice={setActiveAudioDevice}
              />
            </>
          )}
        </>
      </div>
      <SoundVolumeMeter mediaStream={clientStreamRef.current} />
    </div>
  );
}

export default ClientVideo;
