const { Server } = require("socket.io");

const socket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Waiting Queue
  |--------------------------------------------------------------------------
  */

  const waitingQueue = new Map();

  /*
  |--------------------------------------------------------------------------
  | Get Queue
  |--------------------------------------------------------------------------
  */

  const getQueue = () => {
    return Array.from(waitingQueue.values()).map((item) => ({
      userId: item.userId,

      userName: item.userName,

      joinedAt: item.joinedAt,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Broadcast Queue To All Sellers
  |--------------------------------------------------------------------------
  */

  const broadcastQueue = () => {
    io.to("sellers").emit("queueUpdate", getQueue());
  };

  /*
  |--------------------------------------------------------------------------
  | Socket Connection
  |--------------------------------------------------------------------------
  */

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    /*
      |--------------------------------------------------------------------------
      | CUSTOMER JOINS SUPPORT
      |--------------------------------------------------------------------------
      */

    socket.on("joinRoom", ({ userId, userName }) => {
      if (!userId) {
        socket.emit("receiveMessage", {
          sender: "System",

          type: "system",

          message: "Unable to identify your account.",
        });

        return;
      }

      const customerId = String(userId);

      socket.userType = "user";

      socket.userId = customerId;

      socket.userName = userName || "Customer";

      /*
       * Customer room
       */

      socket.join(customerId);

      /*
       * Add customer to queue
       */

      waitingQueue.set(customerId, {
        userId: customerId,

        userName: socket.userName,

        joinedAt: Date.now(),

        socketId: socket.id,
      });

      console.log(`Customer ${customerId} joined support queue`);

      /*
       * Welcome message
       */

      socket.emit("receiveMessage", {
        sender: "Customer Care",

        type: "admin",

        message:
          "Hello 👋 Welcome to POÈME Perfumery. How may we help you today?",
      });

      /*
       * Waiting message
       */

      socket.emit("receiveMessage", {
        sender: "System",

        type: "system",

        message:
          "Your support request has been received. Please wait for an available support agent.",
      });

      /*
       * IMPORTANT:
       * Immediately update every seller.
       */

      broadcastQueue();
    });

    /*
      |--------------------------------------------------------------------------
      | SELLER JOINS SUPPORT
      |--------------------------------------------------------------------------
      */

    socket.on("sellerJoin", ({ sellerId, sellerName }) => {
      if (!sellerId) {
        return;
      }

      socket.userType = "seller";

      socket.sellerId = String(sellerId);

      socket.sellerName = sellerName || "Seller";

      /*
       * Join seller room
       */

      socket.join("sellers");

      console.log(`Seller ${socket.sellerName} joined support`);

      /*
       * Send current queue immediately
       */

      socket.emit("queueUpdate", getQueue());
    });

    /*
      |--------------------------------------------------------------------------
      | REQUEST CURRENT QUEUE
      |--------------------------------------------------------------------------
      */

    socket.on("requestQueue", () => {
      if (socket.userType !== "seller") {
        return;
      }

      socket.emit("queueUpdate", getQueue());
    });

    /*
      |--------------------------------------------------------------------------
      | SELLER CONNECTS TO CUSTOMER
      |--------------------------------------------------------------------------
      */

    socket.on("connectToUser", ({ userId, sellerName }) => {
      if (!userId) {
        return;
      }

      const customerId = String(userId);

      const queueItem = waitingQueue.get(customerId);

      /*
       * Customer no longer waiting
       */

      if (!queueItem) {
        socket.emit("receiveMessage", {
          sender: "System",

          type: "system",

          message: "That customer is no longer waiting for support.",
        });

        /*
         * Refresh seller queue
         */

        socket.emit("queueUpdate", getQueue());

        return;
      }

      /*
       * Remove from waiting queue
       */

      waitingQueue.delete(customerId);

      /*
       * Seller joins customer's room
       */

      socket.join(customerId);

      console.log(`Seller ${sellerName} connected to customer ${customerId}`);

      /*
       * IMPORTANT:
       * Tell CUSTOMER that seller connected.
       *
       * contact.js listens for agentConnected
       * and enables the input.
       */

      io.to(customerId).emit("agentConnected", {
        userId: customerId,

        sellerName: sellerName || "Support Agent",
      });

      /*
       * Customer system message
       */

      io.to(customerId).emit("receiveMessage", {
        sender: "System",

        type: "system",

        message: `A customer support agent (${
          sellerName || "Support Agent"
        }) has joined the chat. You can now message directly.`,
      });

      /*
       * Tell seller which customer
       * was connected
       */

      socket.emit("agentConnected", {
        userId: customerId,

        userName: queueItem.userName,
      });

      /*
       * Update all sellers
       */

      broadcastQueue();
    });

    /*
      |--------------------------------------------------------------------------
      | SEND MESSAGE
      |--------------------------------------------------------------------------
      */

    socket.on("sendMessage", (data) => {
      if (!data) {
        return;
      }

      if (!data.room) {
        return;
      }

      const message =
        typeof data.message === "string" ? data.message.trim() : "";

      if (!message) {
        return;
      }

      /*
       * Prevent extremely large messages
       */

      if (message.length > 1000) {
        socket.emit("receiveMessage", {
          sender: "System",

          type: "system",

          message: "Message is too long. Please keep it under 1000 characters.",
        });

        return;
      }

      /*
       * Send to the other participant.
       *
       * The sender already displays their own
       * message in contact.js.
       */

      socket.to(data.room).emit("receiveMessage", {
        sender: data.sender || "Customer Care",

        type: data.type || "system",

        message: message,
      });
    });

    /*
      |--------------------------------------------------------------------------
      | SELLER DISCONNECTS FROM CUSTOMER
      |--------------------------------------------------------------------------
      */

    socket.on("disconnectFromUser", ({ room, sellerName }) => {
      if (!room) {
        return;
      }

      socket.to(room).emit("receiveMessage", {
        sender: "System",

        type: "system",

        message: `The support agent (${
          sellerName || "Support Agent"
        }) has disconnected. This chat has ended.`,
      });

      socket.to(room).emit("agentDisconnected", {
        sellerName: sellerName || "Support Agent",
      });

      socket.leave(room);

      console.log(
        `Seller ${sellerName || "Support Agent"} left customer room ${room}`
      );
    });

    /*
      |--------------------------------------------------------------------------
      | SOCKET DISCONNECT
      |--------------------------------------------------------------------------
      */

    socket.on("disconnect", () => {
      console.log("Socket Disconnected:", socket.id);

      /*
       * Customer disconnected while
       * waiting in queue.
       */

      if (socket.userType === "user" && socket.userId) {
        const customerId = String(socket.userId);

        const queueItem = waitingQueue.get(customerId);

        /*
         * Only remove this customer if
         * this exact socket created the queue entry.
         */

        if (queueItem && queueItem.socketId === socket.id) {
          waitingQueue.delete(customerId);

          broadcastQueue();
        }
      }

      /*
       * Seller disconnected
       */

      if (socket.userType === "seller") {
        socket.rooms.forEach((room) => {
          /*
           * Ignore socket's own room
           * and seller queue room.
           */

          if (room === socket.id || room === "sellers") {
            return;
          }

          socket.to(room).emit("receiveMessage", {
            sender: "System",

            type: "system",

            message: `The support agent (${
              socket.sellerName || "Support Agent"
            }) has disconnected. This chat has ended.`,
          });

          socket.to(room).emit("agentDisconnected", {
            sellerName: socket.sellerName || "Support Agent",
          });
        });
      }
    });
  });
};

module.exports = socket;
