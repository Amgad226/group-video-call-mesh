import React, { useEffect, useState } from "react";

const SoundVolumeMeter = ({ mediaStream }) => {
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    // let mediaStream = null;
    let audioContext = null;
    let scriptNode = null;

    const handleAudioProcess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      // Calculate the volume level
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);

      // Update the volume level in state
      setVolumeLevel(rms);
    };

    const startAudioProcessing = async () => {
      try {
        if (mediaStream) {
          // Get the user media stream with audio
          // mediaStream = await navigator.mediaDevices.getUserMedia({
          //   audio: true,
          // });

          // Create an audio context
          audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();

          // Create a ScriptProcessorNode to analyze the audio stream
          scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
          scriptNode.connect(audioContext.destination);

          // Connect the media stream to the script node
          const source = audioContext.createMediaStreamSource(mediaStream);
          source.connect(scriptNode);

          // Process the audio data
          scriptNode.onaudioprocess = handleAudioProcess;
        }
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    startAudioProcessing();

    return () => {
      // Cleanup: stop audio processing and release resources
      if (scriptNode) {
        scriptNode.disconnect();
        scriptNode = null;
      }
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
      if (mediaStream) {
        // mediaStream.getTracks().forEach((track) => {
          // track.stop();
        // });
        // mediaStream = null;
      }
    };
  }, [mediaStream]);

  return (
    <div
      style={{
        width: "100%",
        height: "5px",
        background: "black",
        position: "relative",
        zIndex: "1",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: `${volumeLevel * 100}%`,
          height: "5px",
          background: "green",
          transition: "width 0.1s ease-in-out",
        }}
      />
    </div>
  );
};

export default SoundVolumeMeter;
