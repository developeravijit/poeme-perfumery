const socket = io();

const room = userId;

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

// Join User Room
socket.emit("joinRoom", room);

// Receive Messages
socket.on("receiveMessage", (data) => {
  appendMessage(data.sender, data.message, data.type);
});

// Send Button
sendBtn.addEventListener("click", () => sendMessage());

// Enter Key
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Send Message
const sendMessage = () => {
  const message = messageInput.value.trim();

  if (!message) return;

  socket.emit("sendMessage", {
    room,
    sender: "You",
    type: "user",
    message,
  });

  messageInput.value = "";
  messageInput.focus();
};

// Append Message
const appendMessage = (sender, message, type = "user") => {
  const wrapper = document.createElement("div");

  // System Message
  if (type === "system") {
    wrapper.className = "flex justify-center";

    wrapper.innerHTML = `
        <div class="bg-stone-200 text-stone-600 text-sm px-5 py-2 rounded-full">
            ${message}
        </div>
    `;
  } else {
    const isUser = type === "user";

    wrapper.className = `flex ${isUser ? "justify-end" : "justify-start"}`;

    wrapper.innerHTML = `
        <div class="max-w-sm rounded-3xl px-5 py-4 shadow ${
          isUser
            ? "bg-[#B68D40] text-white"
            : "bg-white border border-stone-200"
        }">

            <p class="font-semibold mb-2">
                ${sender}
            </p>

            <p>
                ${message}
            </p>

        </div>
    `;
  }

  chatBox.appendChild(wrapper);

  chatBox.scrollTop = chatBox.scrollHeight;
};
