import { isMobileDevice } from "./isMobileDevice";

export const ChromeName = "Google Chrome";
export const FirefoxName = "Mozilla Firefox";
export const SafariName = "Apple Safari";
export const EdgeName = "Microsoft Edge";
export const OpraName = "Opera";
export const InternentExName = "Internet Explorer";
export const MoblieName = "mobile";

export function getUserAgent() {
  const userAgent = navigator.userAgent;

  const isMobile = isMobileDevice();
  const isEdge = /Edg/.test(userAgent);
  const isOpera = /OPR|Opera/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);
  const isSafari = /^((?!CriOS|FxiOS).)*Safari/.test(userAgent);
  const isInternetExplorer = /MSIE|Trident/.test(userAgent);

  if (isMobile) {
    return MoblieName;
  } else if (isEdge) {
    return EdgeName;
  } else if (isOpera) {
    return OpraName;
  } else if (isFirefox) {
    return FirefoxName;
  } else if (isChrome) {
    return ChromeName;
  } else if (isSafari) {
    return SafariName;
  } else if (isInternetExplorer) {
    return InternentExName;
  } else {
    return "Unknown";
  }
}
