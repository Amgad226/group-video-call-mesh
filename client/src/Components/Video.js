import React, { useEffect, useRef, useState } from "react";
import { StyledVideo } from "./StyledVideo";
import { generateRandomColor } from "../helpers/generateBorderColor";
import styles from "./styles.module.css";
import SoundVolumeMeter from "./SoundMeter";
import { Button, Popover, Space, Tag } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

const Video = ({ peerObj, iAdmin, id, socket, ...restProps }) => {
  const ref = useRef();
  const [forSoundTrackStream, setforSoundTrackStream] = useState();

  useEffect(() => {
    console.log(peerObj);
    peerObj.peer.ontrack = handleTrackEvent;
    // peer.on("stream", (stream) => {
    //   console.log(stream);
    //   ref.current.srcObject = stream;
    // });
    function handleTrackEvent(e) {
      console.log("from track", e);
      ref.current.srcObject = e.streams[0];
      setforSoundTrackStream(e.streams[0]);
    }
  }, []);

  const requestFullScreen = () => {
    if (ref.current.requestFullscreen) {
      ref.current.requestFullscreen();
    } else if (ref.current.mozRequestFullScreen) {
      // Firefox
      ref.current.mozRequestFullScreen();
    } else if (ref.current.webkitRequestFullscreen) {
      // Chrome, Safari and Opera
      ref.current.webkitRequestFullscreen();
    } else if (ref.current.msRequestFullscreen) {
      // IE/Edge
      ref.current.msRequestFullscreen();
    }
  };
  const Actions = (
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
          <Button block type="dashed" danger>
            Mute
          </Button>
          <Button block type="dashed" danger>
            Stop Video
          </Button>
        </>
      )}
      <Button
        onClick={() => {
          requestFullScreen();
        }}
        type="primary"
      >
        Full Screen
      </Button>
    </Space>
  );

  return (
    <div
      style={{ flexDirection: "column-reverse" }}
      className={`${styles.peerVideo} ${styles.videoFrame}`}
    >
      <video
        playsInline
        autoPlay
        ref={ref}
        borderColor={generateRandomColor()}
        className={styles.video}
        // key={uuid()}
      />
      {forSoundTrackStream && (
        <SoundVolumeMeter mediaStream={forSoundTrackStream} />
      )}
      <div className={styles.tagContainer}>
        {peerObj.isAdmin && (
          <Tag className={styles.tag} color="#f50">
            Admin
          </Tag>
        )}
        <Popover placement="bottomRight" content={Actions} trigger="click">
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
  );
};

export default Video;
