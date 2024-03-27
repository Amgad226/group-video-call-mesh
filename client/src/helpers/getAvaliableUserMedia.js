import { checkAudioDevices } from "./checkAudioDevices";
import { checkCameraDevices } from "./checkCameraDevice";

export async function getAvaliableUserMedia() {
  let videoError;
  let audioError;
  const videoStream = await navigator.mediaDevices
    .getUserMedia({
      video: (await checkCameraDevices())
        ? {
            height: window.innerHeight / 2,
            width: window.innerWidth / 2,
          }
        : false,
    })
    .then((videoStream) => videoStream)
    .catch((err) => {
      console.log(err);
      videoError = err;
      return false;
    });
  const audioStream = await navigator.mediaDevices
    .getUserMedia({
      audio: await checkAudioDevices(),
    })
    .then((audioStream) => audioStream)
    .catch((err) => {
      console.log(err);
      audioError = err;
      return false;
    });
  console.log(audioStream);
  console.log(videoStream);
  if (videoStream && audioStream) {
    return new MediaStream([
      videoStream?.getVideoTracks()[0],
      audioStream?.getAudioTracks()[0],
    ]);
  } else if (audioStream) {
    return new MediaStream([audioStream?.getAudioTracks()[0]]);
  } else {
    throw new Error([
      "VideoError :" + videoError,
      "\n",
      "AudioError :" + audioError,
    ]);
  }
}
