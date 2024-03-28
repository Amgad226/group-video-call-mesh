const CONNECTION_CLOSED_THRESHOLD = 10; // Define the threshold value
const CONNECTION_RETRY_THRESHOLD = 100; // Define the threshold value

export const checkAllPeersConnectionState = ({
  counters,
  peers,
  setConnectionFailedReason,
  setFireCheckState,
  setLoading,
}) => {
  const recursiveFunction = () => {
    let allConnected = true;
    let anyClosedConnections = false;
    let anyFailedConnections = false;
    let anyRetryConnectionsExceededThreshold = false;

    const updatedPeers = peers.map((peerObj) => {
      const { peerID, peer } = peerObj;

      console.warn(
        peer.connectionState,
        peerID,
        counters[peerID]?.connectionClosedCount,
        counters[peerID]?.connectionRetryCount
      );

      // Retrieve the counters for the current peer from the counters object
      const { connectionClosedCount = 0, connectionRetryCount = 0 } =
        counters[peerID] || {};

      if (peer.connectionState === "connected") {
        return peerObj;
      } else if (peer.connectionState === "closed") {
        if (connectionClosedCount < CONNECTION_CLOSED_THRESHOLD) {
          // Update the counter for the current peer
          counters[peerID] = {
            connectionClosedCount: connectionClosedCount + 1,
            connectionRetryCount,
          };
          return { peerID, peer };
        } else {
          anyClosedConnections = true;
          return null;
        }
      } else if (
        peer.connectionState === "failed" ||
        peer.connectionState === "disconnected"
      ) {
        anyFailedConnections = true;
        return null;
      } else {
        // new or connecting
        if (connectionRetryCount < CONNECTION_RETRY_THRESHOLD) {
          // Update the counter for the current peer
          counters[peerID] = {
            connectionClosedCount,
            connectionRetryCount: connectionRetryCount + 1,
          };
          return { peerID, peer };
        } else {
          anyRetryConnectionsExceededThreshold = true;
          return null;
        }
      }
    });

    const filteredPeers = updatedPeers.filter(Boolean);
    if (filteredPeers.length === 0) {
      setConnectionFailedReason(
        anyClosedConnections
          ? "closed"
          : anyRetryConnectionsExceededThreshold
          ? "timeout"
          : "failed"
      );
      setFireCheckState(false);
      setLoading(false);
      return;
    }

    allConnected = filteredPeers.every(
      (peerObj) => peerObj.peer.connectionState === "connected"
    );

    if (!allConnected) {
      setTimeout(recursiveFunction, 1000); // Recall the function after a short delay
    } else {
      setLoading(false);
      setFireCheckState(false);
    }
  };
  recursiveFunction();
};
