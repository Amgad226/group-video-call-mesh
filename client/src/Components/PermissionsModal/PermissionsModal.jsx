import { Modal } from "antd";
import React from "react";

function PermissionsModal({ permissionDenied }) {
  return (
    <Modal
      centered
      onOk={() => {
        window.location.reload();
      }}
      okText="Retry"
      cancelButtonProps={{
        style: {
          display: "none",
        },
      }}
      closable={false}
      title="Need Permissions"
      open={!!permissionDenied}
    >
      <p>You have to enable video and audio permission to use our app</p>
      {permissionDenied}
    </Modal>
  );
}

export default PermissionsModal;
