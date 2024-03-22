import React from "react";
import styles from "./styles.module.css";
function ShareScreen({ streamRef }) {
  return (
    <div className={styles.containerrr}>
      <video
        controls
        ref={(videoRef) => {
          if (videoRef && streamRef.current) {
            videoRef.srcObject = streamRef.current;
          }
        }}
        playsInline
        autoPlay
        style={{ width: "100%", height: 500 }}
        className={styles.videoShare}
      />
    </div>
  );
}

export default ShareScreen;
