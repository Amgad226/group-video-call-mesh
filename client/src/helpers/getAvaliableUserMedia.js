import { checkAudioDevices } from "./checkAudioDevices";
import { checkCameraDevices } from "./checkCameraDevice";

export async function getAvaliableUserMedia() {
  return navigator.mediaDevices.getUserMedia({
    video: (await checkCameraDevices())
      ? {
          height: window.innerHeight / 2,
          width: window.innerWidth / 2,
        }
      : false,
    audio: await checkAudioDevices(),
  });
}
