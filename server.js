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
      users[roomID].push({ id: socket.id, isAdmin: false });
    } else {
      users[roomID] = [{ id: socket.id, isAdmin: true }];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter(
      (peer) => peer.id !== socket.id
    );
    socket.emit("all users", usersInThisRoom);
  });

  socket.on("offer", (payload) => {
    // payload : {userToSignal , signal {same sdb} ,callerID}
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const user = room.find((peer) => peer.id === socket.id);

    console.log("offer", user);
    io.to(payload.userToSignal).emit("offer", {
      signal: payload.signal, //new user SDP
      callerID: payload.callerID, // new_user_socket_id
      isAdmin: user.isAdmin,
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
      room = room.filter((peer) => peer.id !== socket.id);
      users[roomID] = room;
    }
    if (users[roomID]?.length > 0) {
      const usersInThisRoom = users[roomID]?.filter(
        (peer) => peer.id !== socket.id
      );
      console.log(usersInThisRoom);

      usersInThisRoom?.forEach((peer) => {
        io.to(peer.id).emit("user-leave", socket.id);
      });
    } else {
      delete users[roomID];
    }
    console.log("rooms", users);
  });

  socket.on("kick-out", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("kick-out by", caller);
    if (caller.isAdmin) {
      console.log("force-leave for", userID);
      io.to(userID).emit("force-leave");
    }
  });
  socket.on("end-call", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("end-call", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("force-leave for", peer);
        io.to(peer.id).emit("force-leave");
      });
    }
  });

  socket.on("mute-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("mute by", caller);

    if (caller.isAdmin) {
      console.log("force-mute for", userID);
      io.to(userID).emit("force-mute");
    }
  });
  socket.on("unmute-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("unmute by", caller);

    if (caller.isAdmin) {
      console.log("unmute for", userID);
      io.to(userID).emit("unmute");
    }
  });
  socket.on("mute-all", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("mute-all", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("force mute-all for", peer);
        if (peer.isAdmin != true) io.to(peer.id).emit("force-mute");
      });
    }
  });
  socket.on("unmute-all", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("unmute-all", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("unmute-all for", peer);
        if (peer.isAdmin != true) io.to(peer.id).emit("unmute");
      });
    }
  });

  socket.on("cam-off-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("mute by", caller);

    if (caller.isAdmin) {
      console.log("force-cam-off for", userID);
      // if (room) {
      //   room = room.filter((peer) => peer.id !== userID);
      //   users[roomID] = room;
      // }

      io.to(userID).emit("force-cam-off");
    }
    // payload : {userToSignal , candidate}
  });
  socket.on("cam-on-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("cam-on by", caller);

    if (caller.isAdmin) {
      console.log("cam-on for", userID);

      io.to(userID).emit("cam-on");
    }
  });
  socket.on("cam-off-all", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("cam-on-all", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("unmute-all for", peer);
        if (peer.isAdmin != true) io.to(peer.id).emit("force-cam-off");
      });
    }
  });
  socket.on("cam-on-all", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    const caller = room.find((peer) => peer.id === socket.id);
    console.log("cam-on-all", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("unmute-all for", peer);
        if (peer.isAdmin != true) io.to(peer.id).emit("cam-on");
      });
    }
  });
});

server.listen(3001, () => console.log("server is running on port 3001"));
