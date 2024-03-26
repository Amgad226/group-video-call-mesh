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

function UserAgentType({ agentType }) {
  switch (agentType) {
    case ChromeName:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faChrome}
        />
      );
    case FirefoxName:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faFirefoxBrowser}
        />
      );
    case SafariName:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faSafari}
        />
      );
    case EdgeName:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faEdge}
        />
      );
    case OpraName:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faOpera}
        />
      );
    case InternentExName:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faInternetExplorer}
        />
      );
    case MoblieName:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faMobile}
        />
      );
    default:
      return (
        <FontAwesomeIcon
          style={{
            color: "whitesmoke",
            position: "relative",
            zIndex: 1,
            fontSize: 30,
          }}
          icon={faCircleQuestion}
        />
      );
  }
}

export default UserAgentType;
