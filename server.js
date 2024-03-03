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
    message: "XX mesh server code XX",
  });
});
io.on("connection", (socket) => {
  console.log(socket);
  socket.on("join room", (roomID) => {
    console.log("join room");
    if (users[roomID]) {
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    console.log("sending signal");
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
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
    console.log("disconnect");

    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    // const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
    socket.emit("user-leave");
    io.emit("user-leave");
  });
});

server.listen(3001, () => console.log("server is running on port 3001"));
