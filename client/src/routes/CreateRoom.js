import React from "react";
import { v1 as uuid } from "uuid";
import styled from "styled-components";
/**
 * just comment to test ci
 * 
 * 
 */
// Styled container component
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e9f9f2; /* Background color */
`;

// Styled button component
const StyledButton = styled.button`
  padding: 10px 20px;
  font-size: 30px;
  font-weight: bold;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

// CreateRoom component
const CreateRoom = (props) => {
  // Function to create a room
  function create() {
    const id = uuid();
    props.history.push(`/room/${id}`);
  }

  return (
    <Container>
      <StyledButton onClick={create}>BACreate roomAB</StyledButton>
    </Container>
  );
};

export default CreateRoom;
