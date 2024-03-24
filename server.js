const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const rooms = {}; //each room is array of users

const socketToRoom = {};

app.get("/", (req, res) => {
  return res.json({
    message: "A**mesh server code**A ",
  });
});

io.on("connection", (socket) => {
  socket.on(
    "join room",
    ({ roomID, userName, voice_bool, video_bool, userAgent }) => {
      console.log(
        "join room",
        socket.id,
        roomID,
        userName,
        voice_bool,
        video_bool,
        userAgent
      );
      if (rooms[roomID]) {
        rooms[roomID].push({
          id: socket.id,
          isAdmin: false,
          voice: voice_bool,
          video: video_bool,
          userName,
          userAgent,
        });
      } else {
        rooms[roomID] = [
          {
            id: socket.id,
            isAdmin: true,
            voice: voice_bool,
            video: video_bool,
            userName,
            userAgent,
          },
        ];
      }
      socketToRoom[socket.id] = roomID;
      const usersInThisRoom = rooms[roomID].filter(
        (peer) => peer.id !== socket.id
      );
      socket.emit("all users", usersInThisRoom);
    }
  );

  socket.on("offer", (payload) => {
    // payload : {userToSignal , signal {same sdb} ,callerID}
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const user = room?.find((peer) => peer.id === socket.id);

    console.log("offer", user);
    io.to(payload.userToSignal).emit("offer", {
      signal: payload.signal, //new user SDP
      callerID: payload.callerID, // new_user_socket_id
      isAdmin: user.isAdmin,
      voice: user.voice,
      video: user.video,
      userName: user.userName,
      userAgent: user.userAgent,
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
    let room = rooms[roomID];
    if (room) {
      room = room?.filter((peer) => peer.id !== socket.id);
      rooms[roomID] = room;
    }
    if (rooms[roomID]?.length > 0) {
      const usersInThisRoom = rooms[roomID]?.filter(
        (peer) => peer.id !== socket.id
      );
      console.log(usersInThisRoom);

      usersInThisRoom?.forEach((peer) => {
        io.to(peer.id).emit("user-leave", socket.id);
      });
    } else {
      delete rooms[roomID];
    }
    console.log("rooms", rooms);
  });

  socket.on("kick-out", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("kick-out by", caller);
    if (caller.isAdmin) {
      console.log("force-leave for", userID);
      io.to(userID).emit("force-leave");
    }
  });
  socket.on("end-call", () => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("end-call", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("force-leave for", peer);
        io.to(peer.id).emit("force-leave");
      });
    }
  });

  socket.on("toggle-voice", ({ voice_bool }) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const userIndex = room?.findIndex((peer) => peer.id === socket.id);

    if (userIndex !== -1) {
      if (room[userIndex]) {
        const updatedUser = { ...room[userIndex], voice: voice_bool };
        room[userIndex] = updatedUser;
        rooms[roomID] = room;
      }

      // room.forEach((peer) => {
      //   if (peer.id !== socket.id) {
      //     console.log("toggle-voice", voice_bool);
      //     io.to(peer.id).emit("user-voice-toggled", {
      //       callerID: socket.id,
      //       voice_bool,
      //     });
      //   }
      // });
    }
  });
  socket.on("mute-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("mute by", caller);

    if (caller.isAdmin) {
      console.log("force-mute for", userID);
      io.to(userID).emit("force-mute");
    }
  });
  socket.on("unmute-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("unmute by", caller);

    if (caller.isAdmin) {
      console.log("unmute for", userID);
      io.to(userID).emit("unmute");
    }
  });
  socket.on("mute-all", () => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
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
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("unmute-all", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("unmute-all for", peer);
        if (peer.isAdmin != true) io.to(peer.id).emit("unmute");
      });
    }
  });

  socket.on("toggle-video", ({ video_bool }) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const userIndex = room?.findIndex((peer) => peer.id === socket.id);

    if (userIndex !== -1) {
      if (room[userIndex]) {
        const updatedUser = { ...room[userIndex], video: video_bool };
        room[userIndex] = updatedUser;
        rooms[roomID] = room;
      }

      // room.forEach((peer) => {
      //   if (peer.id !== socket.id) {
      //     console.log("toggle-video", video_bool);

      //     io.to(peer.id).emit("user-video-toggled", {
      //       callerID: socket.id,
      //       video_bool,
      //     });
      //   }
      // });
    }
  });
  socket.on("cam-off-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("mute by", caller);

    if (caller.isAdmin) {
      console.log("force-cam-off for", userID);
      // if (room) {
      //   room = room?.filter((peer) => peer.id !== userID);
      //   users[roomID] = room;
      // }

      io.to(userID).emit("force-cam-off");
    }
    // payload : {userToSignal , candidate}
  });
  socket.on("cam-on-user", (userID) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("cam-on by", caller);

    if (caller.isAdmin) {
      console.log("cam-on for", userID);

      io.to(userID).emit("cam-on");
    }
  });
  socket.on("cam-off-all", () => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
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
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("cam-on-all", caller);
    if (caller.isAdmin) {
      room?.forEach((peer) => {
        console.log("unmute-all for", peer);
        if (peer.isAdmin != true) io.to(peer.id).emit("cam-on");
      });
    }
  });

  socket.on("remove-track", ({ trackID }) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("remove track", caller.id, trackID);
    room?.forEach((peer) => {
      if (caller.id !== peer.id) {
        console.log("remove track for", peer);
        io.to(peer.id).emit("track-removed", {
          callerID: socket.id,
          trackID,
        });
      }
    });
  });

  socket.on("remove-stream", ({ streamID }) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("stream removed", caller.id, streamID);
    room?.forEach((peer) => {
      if (caller.id !== peer.id) {
        console.log("stream track for", peer);
        io.to(peer.id).emit("stream-removed", {
          callerID: socket.id,
          streamID,
        });
      }
    });
  });

  socket.on("start-share-screen", ({ streamID }) => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("start-share-screen", caller.id, streamID);
    room?.forEach((peer) => {
      if (caller.id !== peer.id) {
        console.log("start-share-screen for", peer);
        io.to(peer.id).emit("share-screen-mode", {
          ownerID: socket.id,
          streamID,
        });
      }
    });
  });

  socket.on("stop-share-screen", () => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    const caller = room?.find((peer) => peer.id === socket.id);
    console.log("stop-share-screen", caller.id);
    room?.forEach((peer) => {
      if (caller.id !== peer.id) {
        console.log("stop-share-screen for", peer);
        io.to(peer.id).emit("share-screen-mode-stop");
      }
    });
  });
});

server.listen(3001, () => console.log("server is running on port 3001"));
