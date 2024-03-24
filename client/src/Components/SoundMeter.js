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

  const getBackgroundColor = () => {
    if (volumeLevel < 0.5) {
      return "green"; // Low volume level
    } else if (volumeLevel < 0.75) {
      return "yellow"; // Medium volume level
    } else {
      return "red"; // High volume level
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "7px",
        background: "black",
        position: "relative",
        zIndex: "1",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          borderRadius: 5,
          width: `${volumeLevel * 300}%`,
          height: "7px",
          background: `rgb(${volumeLevel * 10 * 255},${
            255 / (volumeLevel * 10)
          },0)`,
          transition: "all 0.2s ease-out",
        }}
      />
    </div>
  );
};

export default SoundVolumeMeter;
