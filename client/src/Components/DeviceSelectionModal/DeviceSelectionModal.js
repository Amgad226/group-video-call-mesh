import {
  faMicrophoneLines,
  faVideo
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, notification } from "antd";
import React, { useEffect, useState } from "react";
import { checkConnectionState } from "../../helpers/checkConnectionState";
import styles from "./styles.module.scss";
const DeviceSelectionModal = ({
  showModal,
  setShowModal,
  activeVideoDevice,
  setActiveVideoDevice,
  activeAudioDevice,
  setActiveAudioDevice,
  setHasMultipleDevices,
  peers,
  userVideo,
  clientStreamRef,
  shareScreenStreamRef,
  forceMuted,
  forceVideoStoped,
}) => {
  const [devices, setDevices] = useState([]);
  const [deviceChange, setDeviceChange] = useState(false);

  const handleDeviceSelect = (device) => {
    switchDevice(device.deviceId, device.kind);
    setShowModal(false);
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
          // userVideo.current.srcObject = newStream;
          clientStreamRef.current = newStream;
          if (shareScreenStreamRef.current) {
            shareScreenStreamRef.current = new MediaStream([
              ...shareScreenStreamRef.current.getVideoTracks(),
              ...newStream.getAudioTracks(),
            ]);
          }
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
          console.error("Error accessing in switch audio device:", error);
        });
    } else {
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

  useEffect(() => {
    async function handleDeviceChange() {
      navigator.mediaDevices.ondevicechange = async () => {
        notification.open({
          type: "warning",
          message: "The devices list is change ",
        });
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Check if the ejected device is present in the updated device list
        const isCurrentVideoDeviceEjected = devices
          .filter((device) => device.kind === "videoinput")
          .every(
            (device) =>
              device.deviceId !==
              clientStreamRef.current?.getVideoTracks()[0].getSettings()
                .deviceId
          );

        const isCurrentAudioDeviceEjected = devices
          .filter((device) => device.kind === "audioinput")
          .every(
            (device) =>
              device.deviceId !==
              clientStreamRef.current?.getAudioTracks()[0].getSettings()
                .deviceId
          );
        console.log(isCurrentVideoDeviceEjected);
        console.log(isCurrentAudioDeviceEjected);

        if (isCurrentVideoDeviceEjected || isCurrentAudioDeviceEjected) {
          // Ejected device detected, handle switching to another device input
          setShowModal(true);
        }
        setDeviceChange(Math.random());
      };
    }
    handleDeviceChange();
  }, []);

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
  }, [deviceChange]);

  useEffect(() => {
    checkMultiDevices()
      .then((result) => {
        setHasMultipleDevices(result);
      })
      .catch((error) => {
        console.error("Error checking multiple cameras:", error);
      });
  }, []);

  return (
    <Modal
      destroyOnClose
      title="Avaliable Devices"
      open={showModal}
      onCancel={() => setShowModal(false)}
      footer={null}
    >
      <ul>
        {!forceMuted && devices?.audioinput && (
          <>
            <h3>Audio devices:</h3>
            {devices.audioinput.map((device) => (
              <button
                className={styles.button}
                type="primary"
                key={device.deviceId}
                disabled={activeAudioDevice === device.deviceId ? true : false}
                onClick={() => handleDeviceSelect(device)}
              >
                <FontAwesomeIcon size="lg" icon={faMicrophoneLines} />

                {device.label}
              </button>
            ))}
            <br />
          </>
        )}
        <hr />
        {!forceVideoStoped && devices?.videoinput && (
          <>
            <h3>Video devices:</h3>
            {devices.videoinput.map((device) => (
              <button
                type="primary"
                className={styles.button}
                key={device.deviceId}
                disabled={activeVideoDevice === device.deviceId ? true : false}
                onClick={() => handleDeviceSelect(device)}
              >
                <FontAwesomeIcon size="lg" icon={faVideo} />
                {"  "}
                {device.label}
              </button>
            ))}
          </>
        )}
      </ul>
    </Modal>
  );
};

export default DeviceSelectionModal;
