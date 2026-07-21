const { Server } = require("socket.io");

const socket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    // ================= USER JOIN =================

    socket.on("joinRoom", (userId) => {
      socket.join(userId);

      console.log(`${userId} joined support room`);

      // Welcome Message
      socket.emit("receiveMessage", {
        sender: "Customer Care",
        type: "admin",
        message:
          "Hello 👋 Welcome to POÈME Perfumery. How may we help you today?",
      });

      // Waiting Message
      socket.emit("receiveMessage", {
        sender: "System",
        type: "system",
        message: "Waiting for an available support agent. Kindly wait...",
      });
    });

    // ================= AGENT JOIN =================

    socket.on("agentJoined", (userId) => {
      socket.join(userId);

      io.to(userId).emit("receiveMessage", {
        sender: "System",
        type: "system",
        message: "A customer support agent has joined the chat.",
      });
    });

    // ================= SEND MESSAGE =================

    socket.on("sendMessage", (data) => {
      io.to(data.room).emit("receiveMessage", {
        sender: data.sender,
        type: data.type,
        message: data.message,
      });
    });

    // ================= DISCONNECT =================

    socket.on("disconnect", () => {
      console.log("Socket Disconnected:", socket.id);
    });
  });
};

module.exports = socket;
