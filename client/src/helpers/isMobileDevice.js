export function isMobileDevice() {
    return /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone/i.test(
      navigator.userAgent
    );
  }