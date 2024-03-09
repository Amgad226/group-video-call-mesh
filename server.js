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
    // payload : {userToSignal , signal {same sdb} ,callerID}
    console.log("offer");
    io.to(payload.userToSignal).emit("offer", {
      signal: payload.signal, //new user SDP
      callerID: payload.callerID, // new_user_socket_id
    });
  });

  socket.on("answer", (payload) => {
    // payload : {userToSignal , signal {same sdb} ,callerID}
    console.log("answer");
    io.to(payload.userToSignal).emit("answer", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("ice-candidate", (payload) => {
    // payload : {userToSignal , candidate}
    console.log("ice-candidate");
    io.to(payload.userToSignal).emit("ice-candidate", {
      candidate: payload.candidate,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("disconnect", socket.id);

    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
    console.log(usersInThisRoom);
    
    usersInThisRoom?.forEach((userId) => {
      io.to(userId).emit("user-leave", socket.id);
    });
  });
});

server.listen(3001, () => console.log("server is running on port 3001"));
