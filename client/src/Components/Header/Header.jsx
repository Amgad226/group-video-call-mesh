import React from "react";
import styles from "./styles.module.scss";
import { Popover, Space } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { FullScreenButton } from "../FullScreen/FullScreen";
import Timer from "../Timer/Timer";
function Header({ peers }) {
  const UsersPresents = ({ peers }) => {
    return (
      <>
        {peers.map((peer) => {
          return (
            <div>
              {peer.userName} - {peer.isAdmin ? "admin" : "user"}
            </div>
          );
        })}
      </>
    );
  };
  return (
    <div className={styles.header}>
      <div className={styles.usersPresentsContainer}>
        <div className={styles.popoverContainer}>
          <Popover
            trigger={"hover"}
            placement="bottomRight"
            content={<UsersPresents peers={peers} />}
            title="Present Users"
            arrow={false}
          >
            <Space size={5} className={styles.usersPresents}>
              {peers.length}
              <FontAwesomeIcon icon={faUserCheck} />
            </Space>
          </Popover>
        </div>
      </div>

      <div className={styles.sessionTitle}>York British Academey</div>
      <div className={styles.actionsContainer}>
        <Timer startDate={ new Date(Date.now())} />
        <FullScreenButton />
      </div>
    </div>
  );
}

export default Header;
