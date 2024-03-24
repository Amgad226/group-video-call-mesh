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
import { checkConnectionState } from "../helpers/checkConnectionState";
import UserAgentType from "./UserAgentType";
import { getUserAgent } from "../helpers/getUserAgent";

function ClientVideo({
  userName,
  dataChannelsRef,
  videoDeviceNotExist,
  forceMuted,
  forceVideoStoped,
  userVideo,
  peers,
  clientStreamRef,
  shareScreenStreamRef,
  isAdmin,
  activeVideoDevice,
  setActiveVideoDevice,
  activeAudioDevice,
  setActiveAudioDevice,
  socket,
}) {
  const [showModal, setShowModal] = useState(false);
  const [video, setVideo] = useState(false);
  const [unMute, setUnMute] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
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
      socket.emit("toggle-video", { video_bool: false });
      dataChannelsRef.current.forEach(({ dataChannel }) => {
        if (dataChannel.readyState == "open") {
          dataChannel.send(
            JSON.stringify({
              type: "video-toggle",
              data: {
                video_bool: false,
              },
            })
          );
        }
      });
      clientStreamRef.current
        .getVideoTracks()
        .forEach((track) => (track.enabled = false));
    } else if (video && clientStreamRef.current) {
      socket.emit("toggle-video", { video_bool: true });
      dataChannelsRef.current.forEach(({ dataChannel }) => {
        if (dataChannel.readyState == "open") {
          dataChannel.send(
            JSON.stringify({
              type: "video-toggle",
              data: {
                video_bool: true,
              },
            })
          );
        }
      });
      clientStreamRef.current
        ?.getVideoTracks()
        .forEach((track) => (track.enabled = true));
    }
    // to disable the sharescreen if exist
    if (!video && shareScreenStreamRef.current) {
      shareScreenStreamRef.current
        .getVideoTracks()
        .forEach((track) => (track.enabled = false));
    } else if (video && shareScreenStreamRef.current) {
      shareScreenStreamRef.current
        ?.getVideoTracks()
        .forEach((track) => (track.enabled = true));
    }
  }, [video]);

  useEffect(() => {
    if (!unMute && clientStreamRef.current) {
      socket.emit("toggle-voice", { voice_bool: false });
      dataChannelsRef.current.forEach(({ dataChannel }) => {
        if (dataChannel.readyState == "open") {
          dataChannel.send(
            JSON.stringify({
              type: "voice-toggle",
              data: {
                voice_bool: false,
              },
            })
          );
        }
      });
      clientStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = false));
    } else if (unMute && clientStreamRef.current) {
      socket.emit("toggle-voice", { voice_bool: true });
      dataChannelsRef.current.forEach(({ dataChannel }) => {
        if (dataChannel.readyState == "open") {
          dataChannel.send(
            JSON.stringify({
              type: "voice-toggle",
              data: {
                voice_bool: true,
              },
            })
          );
        }
      });
      clientStreamRef.current
        ?.getAudioTracks()
        .forEach((track) => (track.enabled = true));
    }

    // to disable the sharescreen if exist
    if (!unMute && shareScreenStreamRef.current) {
      shareScreenStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = false));
    } else if (unMute && shareScreenStreamRef.current) {
      shareScreenStreamRef.current
        ?.getAudioTracks()
        .forEach((track) => (track.enabled = true));
    }
  }, [unMute]);

  const setShareScreen = () => {
    // to stop any prev share screen tracks if exist
    if (shareScreenStreamRef.current?.getVideoTracks().length > 0) {
      shareScreenStreamRef.current.getVideoTracks()[0].stop();
      shareScreenStreamRef.current = undefined;
    }
    if (!screenSharing) {
      navigator.mediaDevices
        .getDisplayMedia({
          audio: true,
          video: true,
        })
        .then((shareStreem) => {
          const shareStreemAudioTrack = shareStreem.getAudioTracks()[0];

          if (shareStreemAudioTrack) {
            shareStreem.removeTrack(shareStreemAudioTrack);
          } else {
            shareStreem.addTrack(clientStreamRef.current.getAudioTracks()[0]);
          }

          const screenSharingTrack = shareStreem.getVideoTracks()[0];
          peers?.forEach((peerObj) => {
            const coneectionState = peerObj.peer.connectionState;

            if (checkConnectionState(coneectionState)) {
              const sender = peerObj.peer
                .getSenders()
                .find((s) => s?.track?.kind === "video");

              console.log("audio", shareStreemAudioTrack);
              if (sender) {
                sender.replaceTrack(screenSharingTrack);
              }
            }
          });
          setScreenSharing(true);
          setVideo(true);
          screenSharingTrack.onended = () => {
            endShareScreen();
          };

          userVideo.current.srcObject = shareStreem;
          shareScreenStreamRef.current = shareStreem;
        })
        .catch((e) => {
          console.log(e);
        });
    } else if (screenSharing) {
      endShareScreen();
    }
  };

  const endShareScreen = () => {
    const clientStreamVideo = clientStreamRef.current.getVideoTracks()[0];

    peers?.forEach((peerObj) => {
      const coneectionState = peerObj.peer.connectionState;

      if (checkConnectionState(coneectionState)) {
        const sender = peerObj.peer
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (clientStreamVideo) {
          sender.replaceTrack(clientStreamVideo);
        } else {
          const fakeVideoTrack = createFakeVideoTrack();
          sender.replaceTrack(fakeVideoTrack);
        }
      }
    });
    setScreenSharing(false);
    setVideo(false);
    userVideo.current.srcObject = clientStreamRef.current;
    // getAvaliableUserMedia().then((stream) => {
    //   clientStreamRef.current = stream;
    //
    // });
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
