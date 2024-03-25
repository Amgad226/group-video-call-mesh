import { faGears } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tag } from "antd";
import React, { useEffect, useState } from "react";
import img from "../assets/test.png";
import { checkConnectionState } from "../helpers/checkConnectionState";
import { getUserAgent } from "../helpers/getUserAgent";
import DeviceSelectionModal from "./DeviceSelectionModal";
import SoundVolumeMeter from "./SoundMeter";
import UserAgentType from "./UserAgentType";
import styles from "./styles.module.css";

function ClientVideo({
  userName,
  userVideo,
  peers,
  clientStreamRef,
  isAdmin,
  activeVideoDevice,
  setActiveVideoDevice,
  activeAudioDevice,
  setActiveAudioDevice,
  screenSharing,
  video,
}) {
  const [showModal, setShowModal] = useState(false);
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
    checkMultiDevices()
      .then((result) => {
        setHasMultipleDevices(result);
      })
      .catch((error) => {
        console.error("Error checking multiple cameras:", error);
      });
  }, []);

  const checkMultiDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device_1) => device_1.kind === "audioinput"
      );
      return videoDevices.length > 1 || audioDevices.length > 1 ? true : false;
    } catch (error) {
      return false;
    }
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

          peers?.forEach((peerObj) => {
            const coneectionState = peerObj.peer.connectionState;
            if (checkConnectionState(coneectionState)) {
              const senderV = peerObj.peer
                .getSenders()
                .find((s) => s?.track?.kind === "video");
              senderV.replaceTrack(newStream.getVideoTracks()[0]);
            }
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

          peers?.forEach((peerObj) => {
            const coneectionState = peerObj.peer.connectionState;

            if (checkConnectionState(coneectionState)) {
              const senderV = peerObj.peer
                .getSenders()
                .find((s) => s?.track?.kind === "audio");
              senderV.replaceTrack(newStream.getAudioTracks()[0]);
            }
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

  const handleDeviceSelect = (device) => {
    switchDevice(device.deviceId, device.kind);
    setShowModal(false);
  };

  return (
    <div className={styles.videoFrame}>
      <div className={styles.tagContainer}>
        <UserAgentType agentType={getUserAgent()} />
        {isAdmin && (
          <Tag className={styles.tag} color="#f50">
            Admin
          </Tag>
        )}
        <Tag className={styles.tag} color="blue">
          {userName}
        </Tag>
      </div>
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
