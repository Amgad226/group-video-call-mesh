import { Button } from "antd";
import React from "react";

function ShareScreen({ streamRef }) {
  return (
    <div>
      <video
        ref={(videoRef) => {
          if (videoRef && streamRef.current) {
            videoRef.srcObject = streamRef.current;
          }
        }}
        playsInline
        autoPlay
        style={{ width: "100%", height: 500 }}
      />
    </div>
  );
}

export default ShareScreen;
