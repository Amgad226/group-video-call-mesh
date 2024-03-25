import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";

const Timer = ({ startDate }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      const elapsed = Math.floor((currentTime - startDate.getTime()) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return <div className={styles.timer}> {formatTime(timeElapsed)}</div>;
};

export default Timer;
