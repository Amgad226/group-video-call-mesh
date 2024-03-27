import {
  faEllipsisVertical,
  faMicrophoneSlash,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Popover, Space, Tag } from "antd";
import React, { memo, useEffect, useRef, useState } from "react";
import SoundVolumeMeter from "./SoundMeter";
import UserAgentType from "./UserAgentType";
import styles from "./ClientVideo/styles.module.scss";
import img from "../assets/image.png";

const Video = ({
  dataChannelsRef,
  newTrackForRemoteShareScreenRef,
  setShareScreenMode,
  shareScreenStreamId,
  removedStreamID,
  setRemoveStreamObj,
  peerObj,
  iAdmin,
  id,
  socket,
}) => {
  const videoTagRefs = useRef([]);
  const streamsRefs = useRef([]);
  const [forSoundTrackStream, setforSoundTrackStream] = useState([]);
  const [forceMuted, setForceMuted] = useState(false);
  const [forceVideoStoped, setForceVideoStoped] = useState(false);
  const [streams, setStreams] = useState([]);
  const [peerVideoState, setPeerVideoState] = useState(peerObj.video);
  const [peerVoiceState, setPeerVoiceState] = useState(peerObj.voice);

  const [dataChannelCreated, setDataChannelCreated] = useState(false);
  useEffect(() => {
    console.log(peerObj);
    peerObj.peer.ontrack = handleTrackEvent;
    peerObj.peer.ondatachannel = receiveChannelCallback;
  }, [shareScreenStreamId]);

  useEffect(() => {
    const dataChannelObj = dataChannelsRef.current.find(
      (channelObj) => channelObj.id === id
    );
    if (dataChannelObj && !dataChannelCreated) {
      setDataChannelCreated(true);
    }
    if (dataChannelCreated && dataChannelObj) {
      dataChannelObj.dataChannel.onopen = onReceive_ChannelOpenState;
      dataChannelObj.dataChannel.onmessage = onReceive_ChannelMessageCallback;
      dataChannelObj.dataChannel.onerror = onReceive_ChannelErrorState;
      dataChannelObj.dataChannel.onclose = onReceive_ChannelCloseStateChange;
    }
  }, [dataChannelCreated]);

  useEffect(() => {
    if (removedStreamID) {
      console.log(streamsRefs.current);
      const newStreams = streamsRefs.current.filter(
        (stream) => stream.id !== removedStreamID
      );
      streamsRefs.current = newStreams;
      setStreams([...streamsRefs.current]);
      console.log(streamsRefs.current);
      setRemoveStreamObj();
    }
  }, [removedStreamID]);

  useEffect(() => {
    //if the server event reviced after the track event
    if (shareScreenStreamId) {
      console.log(shareScreenStreamId);
      const shareScreenStream = streamsRefs.current.find(
        (stream) => stream.id == shareScreenStreamId
      );
      console.log("shareScreenStream", shareScreenStream);
      console.log("shareScreenStream", streamsRefs.current);

      if (shareScreenStream) {
        newTrackForRemoteShareScreenRef.current = shareScreenStream;
        const newStreams = streamsRefs.current.filter(
          (stream) => stream.id !== shareScreenStreamId
        );
        streamsRefs.current = [...newStreams];
        setStreams([...streamsRefs.current]);
        setShareScreenMode((prev) => {
          return { ...prev };
        });
      }
    }
  }, [shareScreenStreamId]);

  const requestFullScreen = (ref) => {
    if (ref.requestFullscreen) {
      ref.requestFullscreen();
    } else if (ref.mozRequestFullScreen) {
      // Firefox
      ref.mozRequestFullScreen();
    } else if (ref.webkitRequestFullscreen) {
      // Chrome, Safari and Opera
      ref.webkitRequestFullscreen();
    } else if (ref.msRequestFullscreen) {
      // IE/Edge
      ref.msRequestFullscreen();
    }
  };
  const Actions = (ref) => (
    <>
      {ref && (
        <Space direction="vertical">
          {iAdmin && (
            <>
              <Button
                onClick={() => {
                  socket.emit("kick-out", id);
                }}
                block
                type="primary"
                danger
              >
                Kick-Out
              </Button>
              {!forceMuted && (
                <Button
                  onClick={() => {
                    setForceMuted(true);
                    socket.emit("mute-user", id);
                  }}
                  block
                  type="dashed"
                  danger
                >
                  Mute
                </Button>
              )}
              {forceMuted && (
                <Button
                  onClick={() => {
                    setForceMuted(false);
                    socket.emit("unmute-user", id);
                  }}
                  block
                  type="dashed"
                >
                  unMute
                </Button>
              )}
              {!forceVideoStoped && (
                <Button
                  onClick={() => {
                    setForceVideoStoped(true);
                    socket.emit("cam-off-user", id);
                  }}
                  block
                  type="dashed"
                  danger
                >
                  Stop Video
                </Button>
              )}
              {forceVideoStoped && (
                <Button
                  onClick={() => {
                    setForceVideoStoped(false);
                    socket.emit("cam-on-user", id);
                  }}
                  block
                  type="primary"
                >
                  Enable Video
                </Button>
              )}
            </>
          )}
          <Button
            block
            onClick={() => {
              requestFullScreen(ref);
            }}
            type="primary"
          >
            Full Screen
          </Button>
        </Space>
      )}
    </>
  );
  const handleTrackEvent = (e) => {
    console.log("from track", e);
    console.log("from track", e.streams[0].getTracks());
    const existStream = streamsRefs.current.find(
      (stream) => stream.id === e.streams[0].id
    );
    if (!existStream) {
      streamsRefs.current.push(e.streams[0]);
      setStreams([...streamsRefs.current]);
      if (e.streams[0].getAudioTracks()[0]) {
        setforSoundTrackStream([...streamsRefs.current, e.streams[0]]);
      }
    }
    //if the server event reviced before the track event
    if (shareScreenStreamId) {
      const shareScreenStream = streamsRefs.current.find(
        (stream) => stream.id == shareScreenStreamId
      );
      if (shareScreenStream) {
        console.log("shareScreenStream", shareScreenStream);
        console.log("shareScreenStream", streamsRefs.current);
        newTrackForRemoteShareScreenRef.current = shareScreenStream;
        const newStreams = streamsRefs.current.filter(
          (stream) => stream.id !== shareScreenStreamId
        );
        streamsRefs.current = [...newStreams];
        setStreams([...streamsRefs.current]);
        setShareScreenMode((prev) => {
          return { ...prev };
        });
      }
    }
  };

  const receiveChannelCallback = function (event) {
    const Receive_dataChannel = event.channel;
    dataChannelsRef.current.push({ id, dataChannel: Receive_dataChannel });
    setDataChannelCreated(true);
  };
  var onReceive_ChannelOpenState = function (event) {
    console.log("dataChannel.OnOpen", event);
    // event.srcElement.send("hello from reciver");
  };
  var onReceive_ChannelMessageCallback = function (event) {
    console.log("dataChannel.message", event);
    const data = JSON.parse(event.data);
    console.log(data);
    const messageType = data.type;
    switch (messageType) {
      case "video-toggle":
        {
          const toggleBool = data.data.video_bool;
          setPeerVideoState(toggleBool);
        }
        break;
      case "voice-toggle":
        {
          const toggleBool = data.data.voice_bool;
          setPeerVoiceState(toggleBool);
        }
        break;

      default:
        break;
    }
  };
  var onReceive_ChannelErrorState = function (error) {
    console.log("dataChannel.OnError:", error);
  };
  var onReceive_ChannelCloseStateChange = function (event) {
    const newDataChannels = dataChannelsRef.current.filter(
      (dataChannelObj) => dataChannelObj.id !== id
    );
    dataChannelsRef.current = newDataChannels;
    console.log("dataChannel.OnClose:", event);
  };

  return (
    <>
      {streams.map((stream, index) => {
        return (
          <>
            <div className={`${styles.peerVideo} ${styles.videoFrame}`}>
              {!peerVideoState && (
                <div className={styles.altContainer}>
                  <img src={img} className={styles.altImage} />
                </div>
              )}
              <video
                key={index}
                playsInline
                autoPlay
                ref={(videoRef) => {
                  if (videoRef && stream) {
                    videoRef.srcObject = stream;
                    videoTagRefs.current.push(videoRef);
                  }
                }}
                className={styles.video}
                style={{
                  ...(!peerVideoState ? { opacity: 0 } : {}),
                }}
              />
              <div className={styles.tagContainer}>
                <Space>
                  <UserAgentType agentType={peerObj.userAgent} />
                  <Popover
                    placement="bottomRight"
                    content={Actions(videoTagRefs.current[index])}
                    trigger="click"
                  >
                    <Button
                      type="default"
                      shape="circle"
                      icon={
                        <FontAwesomeIcon
                          icon={faEllipsisVertical}
                          className={styles.options}
                        />
                      }
                    />
                  </Popover>
                </Space>
                {peerObj.isAdmin && (
                  <Tag className={styles.tag} color="#13181e">
                    Owner
                  </Tag>
                )}
              </div>
              {forSoundTrackStream[index] && (
                <div className={styles.soundMeterContainer}>
                  <SoundVolumeMeter mediaStream={forSoundTrackStream[index]} />
                </div>
              )}
              <div className={styles.mediaContainer}>
                <div className={styles.userName}>{peerObj.userName}</div>
                <Space>
                  {!peerVoiceState && (
                    <FontAwesomeIcon
                      className={styles.remoteIcon}
                      icon={faMicrophoneSlash}
                    />
                  )}
                  {!peerVideoState && (
                    <FontAwesomeIcon
                      className={styles.remoteIcon}
                      icon={faVideoSlash}
                    />
                  )}
                </Space>
              </div>
            </div>
          </>
        );
      })}
    </>
  );
};

export default memo(Video);
