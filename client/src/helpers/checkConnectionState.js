export function checkConnectionState(coneectionState) {
  return (
    coneectionState !== "closed" &&
    coneectionState !== "disconnected" &&
    coneectionState !== "failed"
  );
}
