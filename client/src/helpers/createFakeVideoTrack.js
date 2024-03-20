export function createFakeVideoTrack() {
  const canvas = document.createElement("canvas");
  canvas.width = 640; // Set desired video width
  canvas.height = 480; // Set desired video height

  const context = canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const fakeStream = canvas.captureStream();
  const videoTrack = fakeStream.getVideoTracks()[0];
  videoTrack.enabled = false;
  return videoTrack;
}
