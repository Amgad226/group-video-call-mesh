import { Tag } from "antd";
import React from "react";
import img from "../../assets/image1.png";
import styles from "./styles.module.scss";
import SoundVolumeMeter from "../SoundMeter";
import UserAgentType from "../UserAgentType";
import { getUserAgent } from "../../helpers/getUserAgent";
function ClientVideo({
  userName,
  userVideo,
  clientStreamRef,
  isAdmin,
  screenSharing,
  video,
}) {
  return (
    <div className={styles.videoFrame}>
      <div className={styles.tagContainer}>
        <UserAgentType agentType={getUserAgent()} />
        {isAdmin && (
          <Tag className={styles.tag} color="#13181e">
            Owner
          </Tag>
        )}
      </div>
      <div className={styles.soundMeterContainer}>
        <SoundVolumeMeter mediaStream={clientStreamRef.current} />
      </div>
      <div className={styles.mediaContainer}>
        <div className={styles.userName}>{userName}</div>
      </div>
      <video
        className={styles.video}
        src={img}
        muted
        ref={userVideo}
        autoPlay
        playsInline
        style={{
          ...(screenSharing
            ? { transform: "scaleX(1)" }
            : { transform: "scaleX(-1)" }),
          ...(!video && !screenSharing ? { opacity: 0 } : {}),
        }}
      />
      {!video && !screenSharing && (
        <div className={styles.altContainer}>
          <img src={img} className={styles.altImage} />
        </div>
      )}
    </div>
  );
}

export default ClientVideo;
