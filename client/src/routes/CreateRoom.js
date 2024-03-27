import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import styled from "styled-components";
import { Form, Input, Modal, Space } from "antd";
import { useForm } from "antd/es/form/Form";
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
  background-color: blue;
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
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  // Function to create a room
  const [form] = useForm();
  function create(values) {
    const id = uuid();
    props.history.push(`/room/${values.room_id ?? id}/${values.user_name}`);
  }

  const CreateRoomModal = () => {
    return (
      <Modal
        title="Add your name to share it with others"
        open={open}
        centered
        okButtonProps={{
          onClick: form.submit,
        }}
        onCancel={() => {
          setOpen(false);
        }}
      >
        <Form form={form} onFinish={create}>
          <Form.Item
            rules={[{ required: true, message: "enter user name please" }]}
            label="User name"
            labelCol={{ span: 24 }}
            name={"user_name"}
          >
            <Input type="string" />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  const JoinRoomModal = () => {
    return (
      <Modal
        title="Add your name and room id to join"
        open={open2}
        centered
        okButtonProps={{
          onClick: form.submit,
        }}
        onCancel={() => {
          setOpen2(false);
        }}
      >
        <Form form={form} onFinish={create}>
          <Form.Item
            rules={[{ required: true, message: "enter user name please" }]}
            label="User name"
            labelCol={{ span: 24 }}
            name={"user_name"}
          >
            <Input type="string" />
          </Form.Item>
          <Form.Item
            rules={[{ required: true, message: "enter room id please" }]}
            label="ٌRoom id"
            labelCol={{ span: 24 }}
            name={"room_id"}
          >
            <Input type="string" />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <Container>
      <CreateRoomModal />
      <JoinRoomModal />
      <Space>
        <StyledButton
          onClick={() => {
            setOpen(true);
          }}
        >
          sxxs Create room sxxs
        </StyledButton>
        <StyledButton
          onClick={() => {
            setOpen2(true);
          }}
        >
          sx Join Room xs
        </StyledButton>
      </Space>
    </Container>
  );
};

export default CreateRoom;
