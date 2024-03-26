import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faVideo } from "@fortawesome/free-solid-svg-icons";
import { Button, Modal } from "antd";
import { checkConnectionState } from "../helpers/checkConnectionState";

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
  forceMuted,
  forceVideoStoped,
}) => {
  const [devices, setDevices] = useState([]);

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

  return (
    <Modal
      title="Select device"
      open={showModal}
      onCancel={() => setShowModal(false)}
      footer={null}
    >
      <ul>
        {!forceMuted && devices?.audioinput && (
          <>
            <div>Audio devices:</div>
            {devices.audioinput.map((device) => (
              <button
                type="primary"
                key={device.deviceId}
                disabled={activeAudioDevice === device.deviceId ? true : false}
                onClick={() => handleDeviceSelect(device)}
                style={{
                  marginBlock: 4,
                }}
              >
                <FontAwesomeIcon
                  icon={faMicrophone}
                  style={{
                    color:
                      activeAudioDevice === device.deviceId ? "green" : "white",
                  }}
                />
                {"  "}
                {device.label}
              </button>
            ))}
            <br />
          </>
        )}
        {!forceVideoStoped && devices?.videoinput && (
          <>
            <div>Video devices:</div>
            {devices.videoinput.map((device) => (
              <button
                type="primary"
                key={device.deviceId}
                disabled={activeVideoDevice === device.deviceId ? true : false}
                onClick={() => handleDeviceSelect(device)}
                style={{ marginBlock: 4 }}
              >
                <FontAwesomeIcon
                  icon={faVideo}
                  style={{
                    color:
                      activeVideoDevice === device.deviceId ? "green" : "white",
                  }}
                />
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
