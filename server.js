const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};

const socketToRoom = {};
app.get("/", (req, res) => {
  return res.json({
    message: "MWXX mesh server code XXWM",
  });
});
io.on("connection", (socket) => {
  socket.on("join room", (roomID) => {
    console.log("join room", socket.id);
    if (users[roomID]) {
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
    socket.emit("all users", usersInThisRoom);
  });

  socket.on("offer", (payload) => {
    console.log("offer");
    io.to(payload.userToSignal).emit("offer", {
      signal: payload.signal, //new user SDP
      callerID: payload.callerID, // new_user_socket_id
    });
  });

  socket.on("answer", (payload) => {
    console.log("answer");
    io.to(payload.userToSignal).emit("answer", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("ice-candidate", (payload) => {
    console.log("ice-candidate");
    io.to(payload.userToSignal).emit("ice-candidate", {
      candidate: payload.candidate,
      id: socket.id,
    });
  });

  socket.on("sending signal", (payload) => {
    // payload:
    // userToSignal,// any user_socket_id in room (old user in room)
    // callerID, // my socket id (new user for room)
    // signal,// may be have the sdp offer or answer
    console.log("sending signal");
    // send event to user_socket_id that stay in room (old user in room )
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal, //new user SDP
      callerID: payload.callerID, // new_user_socket_id
    });
  });

  socket.on("returning signal", (payload) => {
    //payload is
    //signal is the SDP for old user
    // callerID :socket id for new user
    console.log("returning signal");
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("close", () => {
    console.log("leave");
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    // socket.emit("user leave", 1);
  });

  socket.on("disconnect", () => {
    console.log("disconnect", socket.id);

    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    // const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
    // socket.emit("user-leave");
    io.emit("user-leave", socket.id);
  });
});

server.listen(3001, () => console.log("server is running on port 3001"));
