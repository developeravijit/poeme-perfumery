document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("chatbotToggle");
  const panel = document.getElementById("chatbotPanel");
  const closeBtn = document.getElementById("chatbotClose");
  const messages = document.getElementById("chatbotMessages");
  const input = document.getElementById("chatbotInput");
  const sendBtn = document.getElementById("chatbotSend");

  if (!toggleBtn || !panel || !messages || !input || !sendBtn) return;

  const addMessage = (text, isUser = false) => {
    const bubble = document.createElement("div");
    bubble.className = `flex ${isUser ? "justify-end" : "justify-start"} mb-3`;
    bubble.innerHTML = `
      <div class="max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow ${
        isUser
          ? "bg-[#B68D40] text-white"
          : "bg-stone-100 text-stone-700 border border-stone-200"
      }">
        ${text}
      </div>
    `;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const askBot = async (question) => {
    addMessage("Thinking...", false);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: question }),
      });

      const data = await response.json();
      const reply = data.reply || "I could not generate a response right now.";

      const lastMessage = messages.lastElementChild;
      if (lastMessage && lastMessage.textContent?.includes("Thinking")) {
        lastMessage.remove();
      }

      addMessage(reply, false);
    } catch (error) {
      const lastMessage = messages.lastElementChild;
      if (lastMessage && lastMessage.textContent?.includes("Thinking")) {
        lastMessage.remove();
      }
      addMessage(
        "The AI service is unavailable right now. Please try again later.",
        false
      );
    }
  };

  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = "";
    askBot(text);
  };

  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      input.focus();
    }
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

  addMessage(
    "Hello! I’m POÈME AI Assistant. Ask me about perfumes, orders, shipping, returns, or the site.",
    false
  );
});
