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
import { Button, Col, Menu, Popover, Row, Space } from "antd";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { checkConnectionState } from "../../helpers/checkConnectionState";
import { createFakeVideoTrack } from "../../helpers/createFakeVideoTrack";
import { useWindowSize } from "../../hooks/useWindowSize";
import DeviceSelectionModal from "../DeviceSelectionModal/DeviceSelectionModal";
import styles from "./styles.module.scss";
function ControlBar({
  setShareScreenMode,
  newTrackForLocalShareScreenRef,
  shareScreenMode,
  setSettingModalOpen,
  socketRef,
  clientStreamRef,
  shareScreenStreamRef,
  settingsModalOpen,
  forceMuted,
  dataChannelsRef,
  forceVideoStoped,
  peers,
  peersRef,
  userVideo,
  videoDeviceNotExist,
  iAdmin,
  unMute,
  setUnMute,
  setVideo,
  video,
  screenSharing,
  setScreenSharing,
  activeVideoDevice,
  setActiveVideoDevice,
  activeAudioDevice,
  setActiveAudioDevice,
}) {
  const { width } = useWindowSize();
  const history = useHistory();

  const [initDone, setInitDone] = useState(false);

  const [hasMultipleDevices, setHasMultipleDevices] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
          peersRef?.forEach((peerObj) => {
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

    peersRef?.forEach((peerObj) => {
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
  const addShareScreenWithNewTrack = () => {
    navigator.mediaDevices
      .getDisplayMedia({
        audio: true,
        video: true,
      })
      .then((newStream) => {
        newTrackForLocalShareScreenRef.current = newStream;
        setShareScreenMode({ owner: true, streamId: newStream.id });
        peers.forEach((peerObj) => {
          const coneectionState = peerObj.peer.connectionState;
          if (checkConnectionState(coneectionState)) {
            newStream.getTracks().forEach((track) => {
              peerObj.peer.addTrack(track, newStream);
            });
          }
        });
        socketRef.current.emit("start-share-screen", {
          streamID: newStream.id,
        });
        newStream.getVideoTracks()[0].onended = stopShareScreenWithNewTrack;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const stopShareScreenWithNewTrack = () => {
    console.log(newTrackForLocalShareScreenRef.current);
    newTrackForLocalShareScreenRef.current
      .getTracks()
      .forEach((track) => track.stop());
    peers.forEach((peerObj) => {
      const coneectionState = peerObj.peer.connectionState;
      if (checkConnectionState(coneectionState)) {
        const tracks = newTrackForLocalShareScreenRef.current?.getTracks();
        const senders = peerObj?.peer?.getSenders();
        const sendersToDelete = senders?.filter((sender) =>
          tracks.map((track) => track.id).includes(sender.track?.id)
        );
        sendersToDelete.forEach((sender) => {
          peerObj.peer.removeTrack(sender);
        });
      }
    });
    socketRef.current.emit("remove-stream", {
      callerID: socketRef.current.id,
      streamID: newTrackForLocalShareScreenRef.current.id,
    });
    newTrackForLocalShareScreenRef.current = undefined;
    socketRef.current.emit("stop-share-screen");
    setShareScreenMode({ owner: false, streamId: null });
  };

  const leaveRoom = () => {
    history.push("/");
  };

  return (
    <>
      <DeviceSelectionModal
        showModal={showModal}
        setShowModal={setShowModal}
        activeVideoDevice={activeVideoDevice}
        setActiveVideoDevice={setActiveVideoDevice}
        activeAudioDevice={activeAudioDevice}
        setActiveAudioDevice={setActiveAudioDevice}
        clientStreamRef={clientStreamRef}
        userVideo={userVideo}
        peers={peers}
        setHasMultipleDevices={setHasMultipleDevices}
        forceVideoStoped={forceVideoStoped}
        forceMuted={forceMuted}
      />
      <Row justify={"space-between"} className={styles.controlBar}>
        <Col
          xs={12}
          sm={8}
          md={6}
          lg={5}
          xl={4}
          className={styles.mediaContainer}
        >
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
            disabled={
              (forceVideoStoped || videoDeviceNotExist) && !screenSharing
            }
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
          {hasMultipleDevices && (!forceMuted || !forceVideoStoped) && (
            <Button
              onClick={() => setShowModal(true)}
              type="default"
              className={styles.mediaButton}
            >
              <FontAwesomeIcon className={styles.settingsIcon} icon={faGears} />
            </Button>
          )}
        </Col>
        <Col
          xs={4}
          sm={12}
          md={14}
          lg={17}
          xl={16}
          className={styles.featuresContainer}
        >
          <Menu
            triggerSubMenuAction="click"
            className={styles.featuresMenu}
            mode="horizontal"
            theme="light"
            // selectedKeys={["1"]}
            selectable={false}
          >
            {true && (
              <Menu.Item key={"1"} className={styles.menuItem}>
                <Button
                  disabled={forceVideoStoped}
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
              </Menu.Item>
            )}
            {true && (
              <Menu.Item className={styles.menuItem} key={"2"}>
                <Button
                  block
                  type="text"
                  size="large"
                  onClick={() => {
                    if (!shareScreenMode.streamId) {
                      addShareScreenWithNewTrack();
                    } else if (
                      shareScreenMode.streamId &&
                      shareScreenMode.owner
                    ) {
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
              </Menu.Item>
            )}
            <Menu.Item className={styles.menuItem} disabled key={"3"}>
              <Button
                disabled
                type="text"
                size="large"
                className={`${styles.featureButton}`}
              >
                <FontAwesomeIcon
                  className={styles.featureIcon}
                  icon={faPalette}
                />
                <span className={styles.featureName}>Whiteboard</span>
              </Button>
            </Menu.Item>
            <Menu.Item className={styles.menuItem} disabled key={"4"}>
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
            </Menu.Item>
            <Menu.Item className={styles.menuItem} disabled key={"5"}>
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
            </Menu.Item>
            {iAdmin && (
              <>
                <Menu.Item disabled key={"6"}>
                  <Space size={20} className={styles.fuckenMenuItem}>
                    {width > 1350 && <div className={styles.divider} />}
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
                  </Space>
                </Menu.Item>
                <Menu.Item className={styles.menuItem} key={"7"}>
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
                    <FontAwesomeIcon
                      className={styles.featureIcon}
                      icon={faGear}
                    />
                    <span className={styles.featureName}>Settings</span>
                  </Button>
                </Menu.Item>
              </>
            )}
          </Menu>
        </Col>
        <Col xs={6} sm={4} md={4} lg={2} xl={4} className={styles.endContainer}>
          <Popover
            trigger={"click"}
            placement="topLeft"
            content={
              <Space direction="vertical">
                <Button block danger type="primary" onClick={leaveRoom}>
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
                        clientStreamRef.current
                          ?.getTracks()
                          ?.forEach((track) => {
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
        </Col>
      </Row>
    </>
  );
}

export default ControlBar;
