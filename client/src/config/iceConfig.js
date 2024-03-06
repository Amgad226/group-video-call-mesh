export const iceConfig = {
  sdpSemantics: "unified-plan",
  iceTransportPolicy: "all",
  bundlePolicy: "balanced",
  rtcpMuxPolicy: "negotiate",
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:standard.relay.metered.ca:80",
      username: "86721531a8351f5134873628",
      credential: "glTfzJOpzAiRVSBE",
    },
    {
      urls: "turn:standard.relay.metered.ca:80?transport=tcp",
      username: "86721531a8351f5134873628",
      credential: "glTfzJOpzAiRVSBE",
    },
    {
      urls: "turn:standard.relay.metered.ca:443",
      username: "86721531a8351f5134873628",
      credential: "glTfzJOpzAiRVSBE",
    },
    {
      urls: "turns:standard.relay.metered.ca:443?transport=tcp",
      username: "86721531a8351f5134873628",
      credential: "glTfzJOpzAiRVSBE",
    },
  ],
};
