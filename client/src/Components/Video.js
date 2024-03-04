import React, { useEffect, useRef } from "react";
import { StyledVideo } from "./StyledVideo";
import { generateRandomColor } from "../helpers/generateBorderColor";
import { v1 as uuid } from "uuid";

const Video = ({ peer, ...restProps }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
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
      // key={uuid()}
    />
  );
};

export default Video;
