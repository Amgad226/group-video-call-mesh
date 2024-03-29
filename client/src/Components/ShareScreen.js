import React from "react";
import styles from "./styles.module.css";
function ShareScreen({ streamRef, owner }) {
  return (
    <div className={styles.shareScreenContainer}>
      <video
        muted={owner}
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
