import React, { useEffect, useRef, useState } from "react";
import { StyledVideo } from "./StyledVideo";
import { generateRandomColor } from "../helpers/generateBorderColor";
import styles from "./styles.module.css";
import SoundVolumeMeter from "./SoundMeter";
import { Button, Popover, Space, Tag } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

const Video = ({
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

  useEffect(() => {
    console.log(peerObj);
    peerObj.peer.ontrack = handleTrackEvent;

    function handleTrackEvent(e) {
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
    }
  }, [shareScreenStreamId]);

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

  useEffect(() => {
    console.log(streams);
  }, [streams]);

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

  return (
    <>
      {streams.map((stream, index) => {
        return (
          <>
            <div
              style={{ flexDirection: "column-reverse" }}
              className={`${styles.peerVideo} ${styles.videoFrame}`}
            >
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
                borderColor={generateRandomColor()}
                className={styles.video}
              />
              {forSoundTrackStream[index] && (
                <SoundVolumeMeter mediaStream={forSoundTrackStream[index]} />
              )}
              <div className={styles.tagContainer}>
                {peerObj.isAdmin && (
                  <Tag className={styles.tag} color="#f50">
                    Admin
                  </Tag>
                )}
                <Popover
                  placement="bottomRight"
                  content={Actions(videoTagRefs.current[index])}
                  trigger="click"
                >
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={
                      <FontAwesomeIcon
                        icon={faEllipsisVertical}
                        className={styles.options}
                      />
                    }
                  />
                </Popover>
              </div>
            </div>
          </>
        );
      })}
    </>
  );
};

export default Video;
