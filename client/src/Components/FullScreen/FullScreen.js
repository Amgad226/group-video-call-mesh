import React, { useEffect, useRef, useState } from "react";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";
import { Button } from "antd";

export const FullScreenButton = () => {
  const [isFullscreen, setFullscreen] = useState(false);
  const rootRef = useRef();

  const handleFullScreen = () => {
    if (rootRef?.current) {
      isFullscreen
        ? document.exitFullscreen()
        : rootRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    rootRef.current = document.documentElement;

    const onFullScreenChange = () => {
      setFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    document.addEventListener("mozfullscreenchange", onFullScreenChange);
    document.addEventListener("webkitfullscreenchange", onFullScreenChange);
    document.addEventListener("msfullscreenchange", onFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange);
      document.removeEventListener("mozfullscreenchange", onFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullScreenChange
      );
      document.removeEventListener("msfullscreenchange", onFullScreenChange);
    };
  }, []);

  return (
    <Button
      onClick={handleFullScreen}
      size="large"
      className={`${styles.button} ${isFullscreen && styles.full}`}
      type={isFullscreen ? "text" : "text"}
      icon={
        isFullscreen ? (
          <FullscreenExitOutlined
            style={{
              fontSize: 25,
            }}
          />
        ) : (
          <FullscreenOutlined 
            style={{
              fontSize: 25,
            }}
          />
        )
      }
    />
  );
};
