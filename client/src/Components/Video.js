import React, { useEffect, useRef } from "react";
import { StyledVideo } from "./StyledVideo";
import { generateRandomColor } from "../helpers/generateBorderColor";
import styles from "./styles.module.css";
const Video = ({ peer, ...restProps }) => {
  const ref = useRef();

  useEffect(() => {
    peer.ontrack = handleTrackEvent;
    // peer.on("stream", (stream) => {
    //   console.log(stream);
    //   ref.current.srcObject = stream;
    // });
    function handleTrackEvent(e) {
      ref.current.srcObject = e.streams[0];
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

  return (
    <StyledVideo
      onClick={() => {
        requestFullScreen();
      }}
      playsInline
      autoPlay
      ref={ref}
      borderColor={generateRandomColor()}
      className={styles.peerVideo}
      // key={uuid()}
    />
  );
};

export default Video;
