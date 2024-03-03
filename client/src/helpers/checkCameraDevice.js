export const checkCameraDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameraDevices = devices.filter(
    (device) => device.kind === "videoinput"
  );
  return !!cameraDevices.length;
};
