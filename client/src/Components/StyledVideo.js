import styled from "styled-components";
import img from "../assets/images.png";

export const StyledVideo = styled.video`
  width: 100%;
  height: 295px;
  max-width: 400px;
  // border: 4px solid ${(props) => props.borderColor}; // Dynamic border color
  // border-radius: 10px;
  background-image: url(${img});
  backgound-size: contain;
  background: black;
  // transform : scaleX(-1); because the share screen breaks
`;
