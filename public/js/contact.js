const socket = io();

const isSeller = typeof window.sellerId !== "undefined";
const currentUserId = isSeller ? null : window.userId;
const currentUserName = window.userName || "Customer";
const currentSellerId = isSeller ? window.sellerId : null;
const currentSellerName = isSeller ? window.sellerName || "Seller" : null;

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const queueList = document.getElementById("queueList");
const queueCount = document.getElementById("queueCount");
const connectedUser = document.getElementById("connectedUser");
const disconnectBtn = document.getElementById("disconnectBtn");

let currentRoom = isSeller ? null : currentUserId;
let connectedName = null;

if (isSeller) {
  socket.emit("sellerJoin", {
    sellerId: currentSellerId,
    sellerName: currentSellerName,
  });
} else {
  socket.emit("joinRoom", {
    userId: currentUserId,
    userName: currentUserName,
  });
}

socket.on("receiveMessage", (data) => {
  appendMessage(data.sender, data.message, data.type);
});

socket.on("agentConnected", ({ userId, userName }) => {
  connectedName = userName;
  currentRoom = userId;
  updateConnectedUser();
  appendMessage(
    "System",
    `A customer support agent (${userName}) has joined the chat. You can now message directly.`,
    "system"
  );
});

socket.on("queueUpdate", (queue) => {
  if (!isSeller || !queueList) return;
  renderQueue(queue);
});

sendBtn.addEventListener("click", () => sendMessage());

if (disconnectBtn) {
  disconnectBtn.addEventListener("click", () => disconnectFromUser());
}

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

const sendMessage = () => {
  const message = messageInput.value.trim();
  if (!message) return;
  if (isSeller && !currentRoom) {
    appendMessage(
      "System",
      "Please connect to a waiting user first.",
      "system"
    );
    return;
  }

  const targetRoom = isSeller ? currentRoom : currentUserId;
  const sender = isSeller ? currentSellerName : "You";
  const type = isSeller ? "seller" : "user";

  socket.emit("sendMessage", {
    room: targetRoom,
    sender,
    type,
    message,
  });

  appendMessage(sender, message, type);
  messageInput.value = "";
  messageInput.focus();
};

const renderQueue = (queue) => {
  queueCount.textContent = queue.length;
  if (!queue.length) {
    queueList.innerHTML = `<div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-500 text-center">No users waiting right now.</div>`;
    return;
  }

  queueList.innerHTML = queue
    .map(
      (item) => `
        <div class="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
          <div>
            <div class="font-semibold text-slate-800">${item.userName}</div>
            <div class="text-sm text-slate-500">Waiting since ${new Date(
              item.joinedAt
            ).toLocaleTimeString()}</div>
          </div>
          <button data-user-id="${item.userId}" class="connect-user-btn bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition">Connect</button>
        </div>
      `
    )
    .join("");

  queueList.querySelectorAll(".connect-user-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const userId = btn.dataset.userId;
      connectToUser(userId);
    });
  });
};

const connectToUser = (userId) => {
  if (!userId) return;
  socket.emit("connectToUser", {
    userId,
    sellerName: currentSellerName,
  });
  currentRoom = userId;
  connectedName = `Customer ${userId}`;
  updateConnectedUser();
  appendMessage("System", `Connecting to ${connectedName}...`, "system");
};

const disconnectFromUser = () => {
  if (!currentRoom) {
    appendMessage("System", "No active connection to disconnect.", "system");
    return;
  }

  socket.emit("disconnectFromUser", {
    room: currentRoom,
    sellerName: currentSellerName,
  });

  appendMessage(
    "System",
    `You have disconnected from ${connectedName || currentRoom}.`,
    "system"
  );

  currentRoom = null;
  connectedName = null;
  updateConnectedUser();
};

const updateConnectedUser = () => {
  if (!connectedUser) return;
  connectedUser.textContent = currentRoom
    ? `Connected to: ${connectedName || currentRoom}`
    : "No active connection";

  if (disconnectBtn) {
    disconnectBtn.disabled = !currentRoom;
  }
};

const appendMessage = (sender, message, type = "user") => {
  const wrapper = document.createElement("div");
  if (type === "system") {
    wrapper.className = "flex justify-center";
    wrapper.innerHTML = `
      <div class="bg-stone-200 text-stone-600 text-sm px-5 py-2 rounded-full">
        ${message}
      </div>
    `;
  } else {
    const isUserMessage = type === "user";
    wrapper.className = `flex ${isUserMessage ? "justify-end" : "justify-start"}`;
    wrapper.innerHTML = `
      <div class="max-w-sm rounded-3xl px-5 py-4 shadow ${
        isUserMessage
          ? "bg-[#B68D40] text-white"
          : "bg-white border border-stone-200"
      }">
        <p class="font-semibold mb-2">${sender}</p>
        <p>${message}</p>
      </div>
    `;
  }
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
};
