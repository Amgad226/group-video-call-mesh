export const checkAudioDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioDevices = devices.filter((device) => device.kind === "audioinput");
  return !!audioDevices.length;
};
