import {
  faDisplay,
  faGear,
  faGears,
  faMicrophoneLines,
  faMicrophoneLinesSlash,
  faPalette,
  faPenToSquare,
  faStopwatch,
  faTriangleExclamation,
  faVideo,
  faVideoSlash,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Popover, Space } from "antd";
import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { isMobileDevice } from "../../helpers/isMobileDevice";
import { checkConnectionState } from "../../helpers/checkConnectionState";
import { createFakeVideoTrack } from "../../helpers/createFakeVideoTrack";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

function ControlBar({
  shareScreenMode,
  addShareScreenWithNewTrack,
  stopShareScreenWithNewTrack,
  setSettingModalOpen,
  socketRef,
  clientStreamRef,
  shareScreenStreamRef,
  settingsModalOpen,
  forceMuted,
  dataChannelsRef,
  forceVideoStoped,
  peers,
  userVideo,
  videoDeviceNotExist,
  iAdmin,
  unMute,
  setUnMute,
  setVideo,
  video,
  screenSharing,
  setScreenSharing,
}) {
  const [initDone, setInitDone] = useState(false);
  const history = useHistory();
  useEffect(() => {
    if (!unMute && clientStreamRef.current) {
      socketRef.current.emit("toggle-voice", { voice_bool: false });
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
      socketRef.current.emit("toggle-voice", { voice_bool: true });
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

  useEffect(() => {
    setUnMute(!forceMuted && unMute);
  }, [forceMuted]);

  useEffect(() => {
    if (!video && clientStreamRef.current) {
      socketRef.current.emit("toggle-video", { video_bool: false });
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
      socketRef.current.emit("toggle-video", { video_bool: true });
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
    setVideo(!forceVideoStoped && video);
  }, [forceVideoStoped]);

  useEffect(() => {
    if (clientStreamRef.current && !initDone) {
      setInitDone(true);
      setVideo(!!clientStreamRef.current.getVideoTracks()[0]?.enabled);
      setUnMute(!!clientStreamRef.current.getAudioTracks()[0]?.enabled);
    }
  }, [clientStreamRef.current]);

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

  return (
    <div className={styles.controlBar}>
      <div className={styles.mediaContainer}>
        <Button
          type="primary"
          danger={!unMute}
          style={{ marginInlineStart: 10, opacity: forceMuted ? 0.5 : 1 }}
          className={styles.mediaButton}
          disabled={forceMuted}
          onClick={() => {
            if (!forceMuted) setUnMute(!unMute);
          }}
        >
          <FontAwesomeIcon
            className={styles.mediaIcon}
            icon={unMute ? faMicrophoneLines : faMicrophoneLinesSlash}
          />
        </Button>
        <Button
          disabled={(forceVideoStoped || videoDeviceNotExist) && !screenSharing}
          type="primary"
          className={styles.mediaButton}
          style={{
            opacity: forceVideoStoped ? 0.5 : 1,
          }}
          onClick={() => {
            if (!forceVideoStoped) setVideo(!video);
          }}
          danger={!video || videoDeviceNotExist}
        >
          <FontAwesomeIcon
            className={styles.mediaIcon}
            icon={video ? faVideo : faVideoSlash}
          />
        </Button>
        <Button
          type="default"
          // danger
          // shape="round"
          className={styles.mediaButton}
        >
          <FontAwesomeIcon className={styles.settingsIcon} icon={faGears} />
        </Button>
      </div>
      <div className={styles.featuresContainer}>
        <Space
          style={{
            width: "100%",
            height: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {!isMobileDevice() && (
            <Button
              disabled={forceVideoStoped}
              style={{
                opacity: forceVideoStoped ? 0.5 : 1,
              }}
              type="text"
              size="large"
              onClick={() => {
                if (!forceVideoStoped) setShareScreen();
              }}
              className={`${styles.featureButton} ${
                screenSharing && styles.active
              }`}
            >
              <FontAwesomeIcon
                className={styles.featureIcon}
                icon={faDisplay}
              />
              <span className={styles.featureName}>Share Screen</span>
            </Button>
          )}
          {!isMobileDevice() && (
            <Button
              type="text"
              size="large"
              onClick={() => {
                if (!shareScreenMode.streamId) {
                  addShareScreenWithNewTrack();
                } else if (shareScreenMode.streamId && shareScreenMode.owner) {
                  stopShareScreenWithNewTrack();
                }
              }}
              className={`${styles.featureButton} ${
                shareScreenMode.streamId && styles.active
              }`}
              disabled={shareScreenMode.streamId && !shareScreenMode.owner}
            >
              <FontAwesomeIcon
                className={styles.featureIcon}
                icon={faDisplay}
              />
              <span className={styles.featureName}>Share Screen 2</span>
            </Button>
          )}
          <Button
            disabled
            type="text"
            size="large"
            className={`${styles.featureButton}`}
          >
            <FontAwesomeIcon className={styles.featureIcon} icon={faPalette} />
            <span className={styles.featureName}>Whiteboard</span>
          </Button>
          <Button
            disabled
            type="text"
            size="large"
            className={`${styles.featureButton}`}
          >
            <FontAwesomeIcon
              className={styles.featureIcon}
              icon={faPenToSquare}
            />
            <span className={styles.featureName}>Assignments</span>
          </Button>
          <Button
            disabled
            type="text"
            size="large"
            className={`${styles.featureButton}`}
          >
            <FontAwesomeIcon
              className={styles.featureIcon}
              icon={faStopwatch}
            />
            <span className={styles.featureName}>Break Time</span>
          </Button>
          {iAdmin && (
            <>
              <div className={styles.divider}></div>
              <Button
                disabled
                type="text"
                size="large"
                className={`${styles.featureButton}`}
              >
                <FontAwesomeIcon
                  className={styles.featureIcon}
                  icon={faTriangleExclamation}
                />
                <span className={styles.featureName}>Reports</span>
              </Button>
              <Button
                type="text"
                size="large"
                className={`${styles.featureButton} ${
                  settingsModalOpen && styles.active
                }`}
                onClick={() => {
                  setSettingModalOpen(true);
                }}
              >
                <FontAwesomeIcon className={styles.featureIcon} icon={faGear} />
                <span className={styles.featureName}>Settings</span>
              </Button>
            </>
          )}
        </Space>
      </div>
      <div className={styles.endContainer}>
        <Popover
          trigger={"click"}
          placement="topLeft"
          content={
            <Space direction="vertical">
              <Button
                block
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
                Leave Session
              </Button>
              {iAdmin && (
                <>
                  <Button
                    block
                    type="primary"
                    // size="large"
                    danger
                    onClick={() => {
                      socketRef.current.emit("end-call");
                      clientStreamRef.current?.getTracks()?.forEach((track) => {
                        console.log(track);
                        track.stop();
                      });
                    }}
                  >
                    End Session
                  </Button>
                </>
              )}
            </Space>
          }
        >
          <Button
            className={`${styles.endButton}`}
            size="large"
            danger
            type="primary"
            icon={<FontAwesomeIcon icon={faX} />}
          ></Button>
        </Popover>
      </div>
    </div>
  );
}

export default ControlBar;
