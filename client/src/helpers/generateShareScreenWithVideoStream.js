import { MediaStreamComposer } from "@api.video/media-stream-composer";

export async function generateShareScreenWithVideoStream() {
  const width = 1366;
  const height = 768;
  const screencast = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  });
  const webcam = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  const mediaStreamComposer = new MediaStreamComposer({
    resolution: {
      width,
      height,
    },
  });
  mediaStreamComposer.addStream(screencast, {
    position: "contain",
    mute: false,
  });
  mediaStreamComposer.addStream(webcam, {
    position: "fixed",
    mute: false,
    y: height - 200,
    left: 0,
    x: 120,
    height: 200,
    mask: "circle",
    draggable: true,
    resizable: true,
  });

  console.log(mediaStreamComposer.getResultStream().getTracks());

  return mediaStreamComposer.getResultStream();
}
