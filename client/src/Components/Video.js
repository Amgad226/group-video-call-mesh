import React, { useEffect, useRef } from "react";
import { StyledVideo } from "./StyledVideo";
import { generateRandomColor } from "../helpers/generateBorderColor";
const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    props.peer.on("stream", (stream) => {
      console.log(stream);
      ref.current.srcObject = stream;
    });
  }, []);

  return (
    <StyledVideo
      playsInline
      autoPlay
      ref={ref}
      borderColor={generateRandomColor()}
    />
  );
};

export default Video;
