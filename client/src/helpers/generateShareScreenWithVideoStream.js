import { MediaStreamComposer } from "@api.video/media-stream-composer";

export async function generateShareScreenWithVideoStream() {
  const width = 3840;
  const height = 2160;
  const screencast = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  });
  console.log(screencast.getVideoTracks()[0].getSettings());
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
    y: height - 450,
    left: 0,
    x: width - 800,
    height: 400,
    mask: "circle",
  });

  const resultStream = mediaStreamComposer.getResultStream();
  const videoTrack = resultStream.getVideoTracks()[0];

  const shareScreenTrack = screencast.getVideoTracks()[0];

  shareScreenTrack.onended = () => {
    const event = new Event("force-end");
    videoTrack.dispatchEvent(event);
  };

  videoTrack.addEventListener("force-end", () => {
    console.log("force-end");
    screencast.getTracks().forEach((track) => track.stop());
  });

  return resultStream;
}
