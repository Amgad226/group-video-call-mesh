import React from "react";
import styles from "./styles.module.css";
function ShareScreen({ streamRef }) {
  return (
    <div className={styles.shareScreenContainer}>
      <video
        controls
        ref={(videoRef) => {
          if (videoRef && streamRef.current) {
            videoRef.srcObject = streamRef.current;
          }
        }}
        playsInline
        autoPlay
        className={styles.videoShare}
      />
    </div>
  );
}

export default ShareScreen;
