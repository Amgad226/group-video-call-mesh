import { Tag } from "antd";
import React from "react";
import img from "../../assets/image1.png";
import { getUserAgent } from "../../helpers/getUserAgent";
import UserAgentType from "../UserAgentType";
import styles from "./styles.module.scss";

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
          <Tag className={styles.tag} color="#f50">
            Owner
          </Tag>
        )}
        <Tag className={styles.tag} color="blue">
          {userName}
        </Tag>
      </div>
      <video
        className={styles.video}
        src={img}
        muted
        ref={userVideo}
        autoPlay
        playsInline
        style={{
          ...(screenSharing ? { transform: "scaleX(-1)" } : {}),
          ...(!video && !screenSharing ? { opacity: 0 } : {}),
        }}
      />
      {!video && !screenSharing && (
        <div className={styles.altContainer}>
          <img src={img} className={styles.altImage} />
        </div>
      )}
      <div className={styles.acitons}></div>
      {/* <SoundVolumeMeter mediaStream={clientStreamRef.current} /> */}
    </div>
  );
}

export default ClientVideo;
