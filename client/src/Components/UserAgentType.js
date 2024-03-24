import React from "react";
import {
  ChromeName,
  EdgeName,
  FirefoxName,
  InternentExName,
  MoblieName,
  OpraName,
  SafariName,
  getUserAgent,
} from "../helpers/getUserAgent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion, faMobile } from "@fortawesome/free-solid-svg-icons";
import {
  faChrome,
  faEdge,
  faFirefoxBrowser,
  faInternetExplorer,
  faOpera,
  faSafari,
} from "@fortawesome/free-brands-svg-icons";

function UserAgentType({agentType}) {
  switch (agentType) {
    case ChromeName:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faChrome}
        />
      );
    case FirefoxName:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faFirefoxBrowser}
        />
      );
    case SafariName:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faSafari}
        />
      );
    case EdgeName:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faEdge}
        />
      );
    case OpraName:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faOpera}
        />
      );
    case InternentExName:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faInternetExplorer}
        />
      );
    case MoblieName:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faMobile}
        />
      );
    default:
      return (
        <FontAwesomeIcon
          size="xl"
          style={{ color: "whitesmoke", position: "relative", zIndex: 1 }}
          icon={faCircleQuestion}
        />
      );
  }
}

export default UserAgentType;
