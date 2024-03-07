export const iceConfig = {
  sdpSemantics: "unified-plan",
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    // {
    //   urls: "stun:global.stun.twilio.com:3478?transport=udp",
    // },
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
