import React, { useEffect, useRef, useState } from "react";
import { StyledVideo } from "./StyledVideo";
import { generateRandomColor } from "../helpers/generateBorderColor";
import styles from "./styles.module.css";
import SoundVolumeMeter from "./SoundMeter";

const Video = ({ peer, ...restProps }) => {
  const ref = useRef();
  const [forSoundTrackStream, setforSoundTrackStream] = useState();

  useEffect(() => {
    peer.ontrack = handleTrackEvent;
    // peer.on("stream", (stream) => {
    //   console.log(stream);
    //   ref.current.srcObject = stream;
    // });
    function handleTrackEvent(e) {
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

  return (
    <div className={`${styles.peerVideo} ${styles.videoFrame}`}>
      <StyledVideo
        onClick={() => {
          requestFullScreen();
        }}
        playsInline
        autoPlay
        ref={ref}
        borderColor={generateRandomColor()}

        // key={uuid()}
      />
      {forSoundTrackStream && (
        <SoundVolumeMeter mediaStream={forSoundTrackStream} />
      )}
    </div>
  );
};

export default Video;
