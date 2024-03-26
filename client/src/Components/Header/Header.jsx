import React from "react";
import styles from "./styles.module.scss";
import { Popover, Space } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { FullScreenButton } from "../FullScreen/FullScreen";
import Timer from "../Timer/Timer";
import { useWindowSize } from "../../hooks/useWindowSize";
import img from "../../assets/logo.png";
function Header({ peers }) {
  const { width } = useWindowSize();
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
      {width > 776 ? (
        <div className={styles.sessionTitle}>York British Academey</div>
      ) : (
        <img src={img} width={70} />
      )}

      <div className={styles.actionsContainer}>
        {width > 776 && <Timer startDate={new Date(Date.now())} />}

        <FullScreenButton />
      </div>
    </div>
  );
}

export default Header;
