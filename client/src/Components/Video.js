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
  const realrefs = useRef([]);
  const refs = useRef([]);
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
      const existStream = refs.current.find(
        (stream) => stream.id === e.streams[0].id
      );
      if (!existStream) {
        refs.current.push(e.streams[0]);
        setStreams([...refs.current]);
        if (e.streams[0].getAudioTracks()[0]) {
          setforSoundTrackStream([...refs.current, e.streams[0]]);
        }
      }
      //if the server event reviced before the track event
      if (shareScreenStreamId) {
        const shareScreenStream = refs.current.find(
          (stream) => stream.id == shareScreenStreamId
        );
        if (shareScreenStream) {
          console.log("shareScreenStream", shareScreenStream);
          console.log("shareScreenStream", refs.current);
          newTrackForRemoteShareScreenRef.current = shareScreenStream;
          const newStreams = refs.current.filter(
            (stream) => stream.id !== shareScreenStreamId
          );
          refs.current = [...newStreams];
          setStreams([...refs.current]);
          setShareScreenMode((prev) => {
            return { ...prev };
          });
        }
      }
    }
  }, [shareScreenStreamId]);

  useEffect(() => {
    if (removedStreamID) {
      console.log(refs.current);
      const newStreams = refs.current.filter(
        (stream) => stream.id !== removedStreamID
      );
      refs.current = newStreams;
      setStreams([...refs.current]);
      console.log(refs.current);
      setRemoveStreamObj();
    }
  }, [removedStreamID]);

  useEffect(() => {
    //if the server event reviced after the track event
    if (shareScreenStreamId) {
      console.log(shareScreenStreamId);
      const shareScreenStream = refs.current.find(
        (stream) => stream.id == shareScreenStreamId
      );
      console.log("shareScreenStream", shareScreenStream);
      console.log("shareScreenStream", refs.current);

      if (shareScreenStream) {
        newTrackForRemoteShareScreenRef.current = shareScreenStream;
        const newStreams = refs.current.filter(
          (stream) => stream.id !== shareScreenStreamId
        );
        refs.current = [...newStreams];
        setStreams([...refs.current]);
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
                    realrefs.current.push(videoRef);
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
                  content={Actions(realrefs.current[index])}
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
