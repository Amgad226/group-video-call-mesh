import img from "../assets/test.png";

export function createFakeVideoTrack() {
  const canvas = document.createElement("canvas");
  canvas.width = 640; // Set desired video width
  canvas.height = 480; // Set desired video height

  // const image = new Image();
  // image.src = img; // Replace with the path to your image

  // image.addEventListener("load", () => {
  //   context.drawImage(image, 0, 0, canvas.width, canvas.height);
  // });

  const context = canvas.getContext("2d");
  // context.fillStyle = "red";
  context.fillRect(0, 0, canvas.width, canvas.height);
  setInterval(() => context.clearRect(0, 0, 1, 1), 500);
  context.clearRect(0, 0, 1, 1);

  const fakeStream = canvas.captureStream();
  const videoTrack = fakeStream.getVideoTracks()[0];
  videoTrack.enabled = false;

  return videoTrack;
}
