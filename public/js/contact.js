const socket = io();

const isSeller = typeof window.sellerId !== "undefined";

const currentUserId = isSeller ? null : window.userId;

const currentUserName = isSeller ? null : window.userName || "Customer";

const currentSellerId = isSeller ? window.sellerId : null;

const currentSellerName = isSeller ? window.sellerName || "Seller" : null;

/*
|--------------------------------------------------------------------------
| DOM Elements
|--------------------------------------------------------------------------
*/

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

const queueList = document.getElementById("queueList");
const queueCount = document.getElementById("queueCount");

const connectedUser = document.getElementById("connectedUser");

const connectionStatus = document.getElementById("connectionStatus");

const connectionSubStatus = document.getElementById("connectionSubStatus");

const disconnectBtn = document.getElementById("disconnectBtn");

/*
|--------------------------------------------------------------------------
| Prevent the script from running on pages that do not have chat UI
|--------------------------------------------------------------------------
*/

if (!chatBox || !messageInput || !sendBtn) {
  console.warn("Customer support chat UI not found.");
} else {
  /*
  |--------------------------------------------------------------------------
  | Chat State
  |--------------------------------------------------------------------------
  */

  let currentRoom = isSeller ? null : currentUserId;

  let connectedName = null;

  let chatEnabled = isSeller;

  /*
  |--------------------------------------------------------------------------
  | Enable / Disable Chat Input
  |--------------------------------------------------------------------------
  */

  const setChatEnabled = (enabled) => {
    chatEnabled = enabled;

    if (enabled) {
      messageInput.removeAttribute("disabled");
      sendBtn.removeAttribute("disabled");

      messageInput.classList.remove(
        "disabled:bg-stone-100",
        "disabled:cursor-not-allowed"
      );

      sendBtn.classList.remove(
        "disabled:bg-stone-300",
        "disabled:cursor-not-allowed"
      );
    } else {
      messageInput.setAttribute("disabled", "disabled");

      sendBtn.setAttribute("disabled", "disabled");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Connection Status
  |--------------------------------------------------------------------------
  */

  const updateConnectionStatus = (status, subStatus) => {
    if (connectionStatus) {
      connectionStatus.textContent = status;
    }

    if (connectionSubStatus) {
      connectionSubStatus.textContent = subStatus;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Receive Message
  |--------------------------------------------------------------------------
  */

  socket.on("receiveMessage", (data) => {
    if (!data) return;

    appendMessage(
      data.sender || "Customer Care",
      data.message || "",
      data.type || "system"
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Customer: Seller Connected
  |--------------------------------------------------------------------------
  |
  | This event is emitted by socket.js when the seller
  | accepts the customer.
  |
  */

  socket.on("agentConnected", ({ userId, userName, sellerName }) => {
    /*
     * IMPORTANT:
     * This event is received by BOTH sides.
     */

    if (isSeller) {
      connectedName = userName || "Customer";

      currentRoom = userId;

      updateConnectedUser();

      appendMessage("System", `Connected to ${connectedName}.`, "system");

      return;
    }

    /*
     * Customer side
     */

    connectedName = sellerName || "Customer Care";

    currentRoom = userId || currentUserId;

    updateConnectionStatus(
      "Connected to support",
      `You are now chatting with ${connectedName}.`
    );

    /*
     * THIS ENABLES THE CUSTOMER INPUT
     */

    setChatEnabled(true);

    appendMessage(
      "System",
      `A customer support agent (${connectedName}) has joined the chat. You can now send messages.`,
      "system"
    );

    /*
     * Automatically focus input
     */

    messageInput.focus();
  });

  /*
  |--------------------------------------------------------------------------
  | Agent Disconnected
  |--------------------------------------------------------------------------
  */

  socket.on("agentDisconnected", ({ sellerName }) => {
    if (isSeller) {
      currentRoom = null;
      connectedName = null;

      updateConnectedUser();

      return;
    }

    updateConnectionStatus(
      "Support disconnected",
      "The support agent has left the chat."
    );

    setChatEnabled(false);

    appendMessage(
      "System",
      `The support agent (${sellerName || "Support Agent"}) has disconnected. This chat has ended.`,
      "system"
    );

    currentRoom = currentUserId;
    connectedName = null;
  });

  /*
  |--------------------------------------------------------------------------
  | Seller Queue Update
  |--------------------------------------------------------------------------
  */

  socket.on("queueUpdate", (queue) => {
    if (!isSeller) {
      return;
    }

    renderQueue(Array.isArray(queue) ? queue : []);
  });

  /*
  |--------------------------------------------------------------------------
  | Socket Connected
  |--------------------------------------------------------------------------
  */

  socket.on("connect", () => {
    console.log("Customer support socket connected:", socket.id);

    joinSupportRoom();
  });

  /*
  |--------------------------------------------------------------------------
  | Socket Reconnect
  |--------------------------------------------------------------------------
  */

  socket.on("reconnect", () => {
    console.log("Customer support socket reconnected");

    joinSupportRoom();
  });

  /*
  |--------------------------------------------------------------------------
  | Socket Disconnect
  |--------------------------------------------------------------------------
  */

  socket.on("disconnect", () => {
    console.log("Customer support socket disconnected");

    if (!isSeller) {
      setChatEnabled(false);

      updateConnectionStatus(
        "Connection lost",
        "Trying to reconnect to customer support..."
      );
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Join Support
  |--------------------------------------------------------------------------
  */

  const joinSupportRoom = () => {
    if (!socket.connected) {
      return;
    }

    /*
     * SELLER
     */

    if (isSeller) {
      if (!currentSellerId) {
        console.error("Seller ID is missing.");

        return;
      }

      console.log("Joining seller support room:", currentSellerId);

      socket.emit("sellerJoin", {
        sellerId: currentSellerId,

        sellerName: currentSellerName,
      });

      /*
       * Ask server for current queue.
       *
       * This is important when a customer
       * entered the queue before the seller
       * opened the seller chat page.
       */

      socket.emit("requestQueue");

      return;
    }

    /*
     * CUSTOMER
     */

    if (!currentUserId) {
      console.error("Customer user ID is missing.");

      updateConnectionStatus(
        "Unable to connect",
        "Your account could not be identified."
      );

      return;
    }

    setChatEnabled(false);

    updateConnectionStatus(
      "Waiting for support",
      "You will be connected to an available support agent."
    );

    console.log("Joining customer support queue:", currentUserId);

    socket.emit("joinRoom", {
      userId: currentUserId,

      userName: currentUserName,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Socket State
  |--------------------------------------------------------------------------
  */

  if (socket.connected) {
    joinSupportRoom();
  }

  /*
  |--------------------------------------------------------------------------
  | Send Button
  |--------------------------------------------------------------------------
  */

  sendBtn.addEventListener("click", () => {
    sendMessage();
  });

  /*
  |--------------------------------------------------------------------------
  | Enter Key
  |--------------------------------------------------------------------------
  */

  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      sendMessage();
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Seller Disconnect Button
  |--------------------------------------------------------------------------
  */

  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", () => {
      disconnectFromUser();
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Send Message
  |--------------------------------------------------------------------------
  */

  const sendMessage = () => {
    const message = messageInput.value.trim();

    if (!message) {
      return;
    }

    /*
     * Customer cannot send before seller connects
     */

    if (!isSeller && !chatEnabled) {
      appendMessage(
        "System",
        "Please wait until a support agent is connected.",
        "system"
      );

      return;
    }

    /*
     * Seller must connect to customer first
     */

    if (isSeller && !currentRoom) {
      appendMessage(
        "System",
        "Please connect to a waiting customer first.",
        "system"
      );

      return;
    }

    /*
     * Room
     */

    const targetRoom = isSeller ? currentRoom : currentUserId;

    /*
     * Sender
     */

    const sender = isSeller ? currentSellerName : currentUserName || "You";

    /*
     * Message type
     */

    const type = isSeller ? "seller" : "user";

    /*
     * Send to server
     */

    socket.emit("sendMessage", {
      room: targetRoom,

      sender: sender,

      type: type,

      message: message,
    });

    /*
     * Show own message immediately
     */

    appendMessage(sender, message, type);

    /*
     * Clear input
     */

    messageInput.value = "";

    messageInput.focus();
  };

  /*
  |--------------------------------------------------------------------------
  | Render Seller Queue
  |--------------------------------------------------------------------------
  */

  const renderQueue = (queue) => {
    if (!queueList || !queueCount) {
      return;
    }

    queueCount.textContent = queue.length;

    if (!queue.length) {
      queueList.innerHTML = `
        <div
          class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-500 text-center"
        >
          No users waiting right now.
        </div>
      `;

      return;
    }

    queueList.innerHTML = queue
      .map((item) => {
        const userName = escapeHTML(item.userName || "Customer");

        const userId = escapeHTML(String(item.userId || ""));

        const joinedAt = item.joinedAt
          ? new Date(item.joinedAt).toLocaleTimeString()
          : "";

        return `
              <div
                class="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4"
              >

                <div class="min-w-0">

                  <div
                    class="font-semibold text-slate-800 truncate"
                  >
                    ${userName}
                  </div>

                  <div
                    class="text-sm text-slate-500 mt-1"
                  >
                    Waiting since ${escapeHTML(joinedAt)}
                  </div>

                </div>

                <button
                  type="button"
                  data-user-id="${userId}"
                  class="connect-user-btn shrink-0 bg-[#B68D40] text-white px-5 py-2 rounded-full hover:bg-[#9D7A37] transition"
                >
                  Connect
                </button>

              </div>
            `;
      })
      .join("");

    /*
     * Add Connect button listeners
     */

    queueList.querySelectorAll(".connect-user-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const userId = button.dataset.userId;

        connectToUser(userId);
      });
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Seller Connect To User
  |--------------------------------------------------------------------------
  */

  const connectToUser = (userId) => {
    if (!userId) {
      return;
    }

    console.log("Connecting seller to customer:", userId);

    socket.emit("connectToUser", {
      userId: userId,

      sellerName: currentSellerName,
    });

    /*
     * Do not wait for this to enable
     * the customer.
     *
     * The server sends agentConnected
     * to the customer after successful
     * connection.
     */

    currentRoom = userId;

    connectedName = "Customer";

    updateConnectedUser();

    appendMessage("System", "Connecting to customer...", "system");
  };

  /*
  |--------------------------------------------------------------------------
  | Seller Disconnect From User
  |--------------------------------------------------------------------------
  */

  const disconnectFromUser = () => {
    if (!currentRoom) {
      appendMessage("System", "No active customer connection.", "system");

      return;
    }

    socket.emit("disconnectFromUser", {
      room: currentRoom,

      sellerName: currentSellerName,
    });

    appendMessage(
      "System",
      `You have disconnected from ${connectedName || "the customer"}.`,
      "system"
    );

    currentRoom = null;

    connectedName = null;

    updateConnectedUser();
  };

  /*
  |--------------------------------------------------------------------------
  | Update Seller Connected User
  |--------------------------------------------------------------------------
  */

  const updateConnectedUser = () => {
    if (!connectedUser) {
      return;
    }

    connectedUser.textContent = currentRoom
      ? `Connected to: ${connectedName || currentRoom}`
      : "No active connection";

    if (disconnectBtn) {
      disconnectBtn.disabled = !currentRoom;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Escape HTML
  |--------------------------------------------------------------------------
  */

  const escapeHTML = (value) => {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
  };

  /*
  |--------------------------------------------------------------------------
  | Add Message To Chat
  |--------------------------------------------------------------------------
  */

  const appendMessage = (sender, message, type = "user") => {
    const wrapper = document.createElement("div");

    /*
     * System message
     */

    if (type === "system") {
      wrapper.className = "flex justify-center";

      wrapper.innerHTML = `
        <div
          class="bg-stone-200 text-stone-600 text-sm px-5 py-2.5 rounded-full text-center max-w-[90%]"
        >
          ${escapeHTML(message)}
        </div>
      `;
    }

    /*
     * Normal message
     */
    else {
      const isUserMessage = type === "user";

      wrapper.className = `flex ${
        isUserMessage ? "justify-end" : "justify-start"
      }`;

      wrapper.innerHTML = `
        <div
          class="max-w-[85%] md:max-w-lg rounded-3xl px-5 py-4 shadow-sm ${
            isUserMessage
              ? "bg-[#B68D40] text-white"
              : "bg-white border border-stone-200 text-stone-800"
          }"
        >

          <p class="font-semibold mb-1">
            ${escapeHTML(sender)}
          </p>

          <p class="leading-relaxed whitespace-pre-wrap break-words">
            ${escapeHTML(message)}
          </p>

        </div>
      `;
    }

    chatBox.appendChild(wrapper);

    chatBox.scrollTop = chatBox.scrollHeight;
  };
}
