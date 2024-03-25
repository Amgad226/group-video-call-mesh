import { Button, Modal, Space } from "antd";
import React from "react";

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
  return (
    <Modal
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
      <Space direction="vertical">
        {iAdmin && (
          <>
            {adminMuteAll && (
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setAdminMuteAll(false);
                  socketRef.current.emit("unmute-all");
                }}
              >
                Enable Talk
              </Button>
            )}
            {!adminMuteAll && (
              <Button
                type="primary"
                size="large"
                danger
                onClick={() => {
                  setAdminMuteAll(true);
                  socketRef.current.emit("mute-all");
                }}
              >
                Disable Talk
              </Button>
            )}
            {adminStopCamAll && (
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setAdminStopCamAll(false);
                  socketRef.current.emit("cam-on-all");
                }}
              >
                Enable Video
              </Button>
            )}
            {!adminStopCamAll && (
              <Button
                type="primary"
                size="large"
                danger
                onClick={() => {
                  setAdminStopCamAll(true);
                  socketRef.current.emit("cam-off-all");
                }}
              >
                Disable Video
              </Button>
            )}
          </>
        )}
      </Space>
    </Modal>
  );
}

export default SettingsModal;
