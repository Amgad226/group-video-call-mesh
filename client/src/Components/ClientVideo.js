import { Tag } from "antd";
import React from "react";
import img from "../assets/test.png";
import { getUserAgent } from "../helpers/getUserAgent";
import SoundVolumeMeter from "./SoundMeter";
import UserAgentType from "./UserAgentType";
import styles from "./styles.module.css";

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
            Admin
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
        style={
          !screenSharing
            ? {
                transform: "scaleX(-1)",
              }
            : {}
        }
      />
      {!video && !screenSharing && <img src={img} className={styles.alt} />}
      <div className={styles.acitons}></div>
      <SoundVolumeMeter mediaStream={clientStreamRef.current} />
    </div>
  );
}

export default ClientVideo;
