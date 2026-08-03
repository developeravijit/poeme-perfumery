const { Server } = require("socket.io");

const socket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  const waitingQueue = new Map();

  const broadcastQueue = () => {
    const queueList = Array.from(waitingQueue.values()).map((item) => ({
      userId: item.userId,
      userName: item.userName,
      joinedAt: item.joinedAt,
    }));

    io.to("sellers").emit("queueUpdate", queueList);
  };

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    socket.on("joinRoom", ({ userId, userName }) => {
      socket.userType = "user";
      socket.userId = userId;
      socket.userName = userName || "Customer";

      socket.join(userId);
      waitingQueue.set(userId, {
        userId,
        userName: socket.userName,
        joinedAt: Date.now(),
        socketId: socket.id,
      });

      console.log(`${userId} joined support room`);

      socket.emit("receiveMessage", {
        sender: "Customer Care",
        type: "admin",
        message:
          "Hello 👋 Welcome to POÈME Perfumery. How may we help you today?",
      });

      socket.emit("receiveMessage", {
        sender: "System",
        type: "system",
        message: "Waiting for an available support agent. Kindly wait...",
      });

      broadcastQueue();
    });

    socket.on("sellerJoin", ({ sellerId, sellerName }) => {
      socket.userType = "seller";
      socket.sellerId = sellerId;
      socket.sellerName = sellerName || "Seller";

      socket.join("sellers");

      socket.emit(
        "queueUpdate",
        Array.from(waitingQueue.values()).map((item) => ({
          userId: item.userId,
          userName: item.userName,
          joinedAt: item.joinedAt,
        }))
      );
    });

    socket.on("connectToUser", ({ userId, sellerName }) => {
      const queueItem = waitingQueue.get(userId);
      if (!queueItem) {
        socket.emit("receiveMessage", {
          sender: "System",
          type: "system",
          message: "That user is no longer waiting.",
        });
        return;
      }

      waitingQueue.delete(userId);
      socket.join(userId);

      io.to(userId).emit("receiveMessage", {
        sender: "System",
        type: "system",
        message: `A customer support agent (${sellerName}) has joined the chat. You can now message directly.`,
      });

      socket.emit("agentConnected", {
        userId,
        userName: queueItem.userName,
      });

      broadcastQueue();
    });

    socket.on("disconnectFromUser", ({ room, sellerName }) => {
      if (!room) return;

      socket.to(room).emit("receiveMessage", {
        sender: "System",
        type: "system",
        message: `The support agent (${sellerName}) has disconnected. This chat has ended.`,
      });

      socket.leave(room);
    });

    socket.on("sendMessage", (data) => {
      if (!data.room) return;
      socket.to(data.room).emit("receiveMessage", {
        sender: data.sender,
        type: data.type,
        message: data.message,
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected:", socket.id);
      if (socket.userType === "user" && socket.userId) {
        if (waitingQueue.has(socket.userId)) {
          waitingQueue.delete(socket.userId);
          broadcastQueue();
        }
      }
    });
  });
};

module.exports = socket;
