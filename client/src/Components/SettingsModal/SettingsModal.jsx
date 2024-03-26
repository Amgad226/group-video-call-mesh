import { Button, Modal, Space, Switch } from "antd";
import React, { useState } from "react";
import styles from "./styles.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophoneLines,
  faMicrophoneLinesSlash,
  faVideo,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";

function SettingsModal({
  iAdmin,
  adminMuteAll,
  setSettingModalOpen,
  settingsModalOpen,
  setAdminMuteAll,
  socketRef,
  adminStopCamAll,
  setAdminStopCamAll,
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Modal
      width={400}
      destroyOnClose
      centered
      onOk={() => {
        setSettingModalOpen(false);
      }}
      closable={false}
      okText="Close"
      cancelButtonProps={{
        style: {
          display: "none",
        },
      }}
      title="Settings"
      open={settingsModalOpen}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {iAdmin && (
          <>
            <div className={styles.row}>
              <div className={styles.title}>Talk Permission For Others :</div>

              <Switch
                loading={loading}
                checkedChildren={
                  <FontAwesomeIcon size="lg" icon={faMicrophoneLines} />
                }
                unCheckedChildren={
                  <FontAwesomeIcon size="lg" icon={faMicrophoneLinesSlash} />
                }
                onChange={(checked) => {
                  setLoading(true);
                  if (checked) {
                    setAdminMuteAll(false);
                    socketRef.current.emit("unmute-all");
                  } else {
                    setAdminMuteAll(true);
                    socketRef.current.emit("mute-all");
                  }
                  setTimeout(() => {
                    setLoading(false);
                  }, 2000);
                }}
                defaultChecked={!adminMuteAll}
              />
            </div>
            <div className={styles.row}>
              <div className={styles.title}>Video Permission For Others :</div>

              <Switch
                loading={loading}
                checkedChildren={<FontAwesomeIcon size="lg" icon={faVideo} />}
                unCheckedChildren={
                  <FontAwesomeIcon size="lg" icon={faVideoSlash} />
                }
                onChange={(checked) => {
                  setLoading(true);
                  if (checked) {
                    setAdminStopCamAll(false);
                    socketRef.current.emit("cam-on-all");
                  } else {
                    setAdminStopCamAll(true);
                    socketRef.current.emit("cam-off-all");
                  }
                  setTimeout(() => {
                    setLoading(false);
                  }, 2000);
                }}
                defaultChecked={!adminStopCamAll}
              />
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
}

export default SettingsModal;
