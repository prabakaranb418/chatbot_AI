(() => {
  "use strict";

  const STORAGE_KEY = "praba_ai_history_v1";

  const $ = (id) => document.getElementById(id);

  const ui = {
    sidebar: $("sidebar"),
    newChat: $("newChatBtn"),
    home: $("homeBtn"),
    historyBtn: $("historyBtn"),
    historyList: $("historyList"),
    clearHistory: $("clearHistoryBtn"),
    welcome: $("welcome"),
    conversation: $("conversation"),
    conversationTitle: $("conversationTitle"),
    pageTitle: $("pageTitle"),
    messages: $("messages"),
    form: $("chatForm"),
    input: $("messageInput"),
    send: $("sendBtn"),
    toast: $("toast"),
    modal: $("aboutModal"),
  };

  let chats = loadHistory();
  let activeChatId = null;
  let busy = false;
  let toastTimer;

  function loadHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {
      showToast("Storage is full. Please clear old conversations.");
    }
  }

  function createId() {
    return window.crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getActiveChat() {
    return chats.find((chat) => chat.id === activeChatId) || null;
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      ui.toast.classList.remove("show");
    }, 3000);
  }

  function createChat() {
    if (busy) return;

    const chat = {
      id: createId(),
      title: "New conversation",
      messages: [],
      updatedAt: Date.now(),
    };

    chats.unshift(chat);
    activeChatId = chat.id;

    saveHistory();
    render();

    ui.input.focus();
    ui.sidebar.classList.remove("open");
  }

  function createTitle(text) {
    const title = text.trim().replace(/\s+/g, " ");

    return title.length > 34 ? title.slice(0, 34) + "…" : title;
  }

  function deleteChat(chatId) {
    if (busy && chatId === activeChatId) {
      showToast("Please wait for the current response.");
      return;
    }

    chats = chats.filter((chat) => chat.id !== chatId);

    if (activeChatId === chatId) {
      activeChatId = null;
    }

    saveHistory();
    render();
    showToast("Conversation deleted.");
  }

  function renderHistory() {
    ui.historyList.replaceChildren();

    if (!chats.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      empty.textContent = "Your conversations will appear here.";

      ui.historyList.appendChild(empty);
      return;
    }

    [...chats]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach((chat) => {
        const row = document.createElement("div");
        row.className = "history-entry";

        const open = document.createElement("button");
        open.className =
          "history-open" + (chat.id === activeChatId ? " selected" : "");

        const symbol = document.createElement("span");
        symbol.className = "history-symbol";
        symbol.textContent = "◷";

        const name = document.createElement("span");
        name.className = "history-name";
        name.textContent = chat.title;
        name.title = chat.title;

        open.append(symbol, name);

        open.addEventListener("click", () => {
          if (busy) return;

          activeChatId = chat.id;
          render();
          ui.sidebar.classList.remove("open");
        });

        const remove = document.createElement("button");
        remove.className = "delete-chat";
        remove.textContent = "×";
        remove.title = "Delete conversation";
        remove.setAttribute("aria-label", "Delete conversation");

        remove.addEventListener("click", () => {
          deleteChat(chat.id);
        });

        row.append(open, remove);
        ui.historyList.appendChild(row);
      });
  }

  function addMessage(role, content, typing = false) {
    const article = document.createElement("article");
    article.className = `message ${role === "user" ? "user" : "assistant"}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "Y" : "P";

    const body = document.createElement("div");
    body.className = "message-body";

    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent = role === "user" ? "You" : "Praba AI";

    const text = document.createElement("div");
    text.className = "message-content";

    if (typing) {
      const dots = document.createElement("div");
      dots.className = "typing";

      for (let i = 0; i < 3; i++) {
        dots.appendChild(document.createElement("span"));
      }

      text.appendChild(dots);
      text.setAttribute("aria-label", "AI is thinking");
    } else {
      // Display responses as text, not executable HTML.
      text.textContent = content;
    }

    body.append(label, text);
    article.append(avatar, body);
    ui.messages.appendChild(article);

    return article;
  }

  function renderMessages() {
    const chat = getActiveChat();

    ui.messages.replaceChildren();

    if (!chat) return;

    chat.messages.forEach((message) => {
      addMessage(message.role, message.content);
    });

    ui.messages.scrollTop = ui.messages.scrollHeight;
  }

  function render() {
    const chat = getActiveChat();

    ui.welcome.hidden = Boolean(chat);
    ui.conversation.hidden = !chat;

    ui.home.classList.toggle("active", !chat);
    ui.historyBtn.classList.toggle("active", Boolean(chat));

    ui.pageTitle.textContent = chat ? chat.title : "Overview";

    if (chat) {
      ui.conversationTitle.textContent = chat.title;
      renderMessages();
    }

    renderHistory();
  }

  function setBusy(value) {
    busy = value;
    ui.send.disabled = value;
    ui.input.disabled = value;

    ui.send.querySelector("span").textContent = value ? "Thinking..." : "Send";
  }

  function resizeInput() {
    ui.input.style.height = "auto";

    ui.input.style.height = Math.min(ui.input.scrollHeight, 180) + "px";
  }

  async function sendMessage(prompt) {
    const content = (prompt ?? ui.input.value).trim();

    if (!content || busy) return;

    if (!getActiveChat()) {
      createChat();
    }

    const chat = getActiveChat();

    chat.messages.push({
      role: "user",
      content,
    });

    if (chat.messages.filter((m) => m.role === "user").length === 1) {
      chat.title = createTitle(content);
    }

    chat.updatedAt = Date.now();

    saveHistory();

    ui.input.value = "";
    resizeInput();

    render();

    const typing = addMessage("assistant", "", true);

    ui.messages.scrollTop = ui.messages.scrollHeight;

    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chat.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      chat.messages.push({
        role: "assistant",
        content: data.reply,
      });

      chat.updatedAt = Date.now();

      saveHistory();

      typing.remove();
      addMessage("assistant", data.reply);

      ui.pageTitle.textContent = chat.title;
      ui.conversationTitle.textContent = chat.title;

      renderHistory();

      ui.messages.scrollTop = ui.messages.scrollHeight;
    } catch (error) {
      typing.remove();

      addMessage(
        "assistant",
        "I couldn't complete your request.\n\n" + error.message,
      );

      ui.messages.scrollTop = ui.messages.scrollHeight;
      showToast(error.message);
    } finally {
      setBusy(false);
      ui.input.focus();
    }
  }

  // Send message
  ui.form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  // Enter sends; Shift + Enter creates a new line.
  ui.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      ui.form.requestSubmit();
    }
  });

  ui.input.addEventListener("input", resizeInput);

  // New conversation
  ui.newChat.addEventListener("click", createChat);

  // Overview
  ui.home.addEventListener("click", () => {
    if (busy) return;

    activeChatId = null;
    render();
    ui.sidebar.classList.remove("open");
  });

  // Recent conversations
  ui.historyBtn.addEventListener("click", () => {
    if (busy) return;

    const latest = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)[0];

    if (latest) {
      activeChatId = latest.id;
      render();
    } else {
      showToast("Start a conversation to build your history.");
    }
  });

  // Clear all local history
  ui.clearHistory.addEventListener("click", () => {
    if (busy) {
      showToast("Please wait for the current response.");
      return;
    }

    if (!chats.length) {
      showToast("There is no history to clear.");
      return;
    }

    if (confirm("Delete all conversations saved in this browser?")) {
      chats = [];
      activeChatId = null;

      saveHistory();
      render();

      showToast("Local history cleared.");
    }
  });

  // Quick action cards
  document.querySelectorAll("[data-prompt]").forEach((card) => {
    card.addEventListener("click", () => {
      if (busy) return;

      ui.input.value = card.dataset.prompt;
      resizeInput();
      ui.input.focus();
    });
  });

  // About modal
  ui.modal.querySelector("#closeAbout").addEventListener("click", () => {
    ui.modal.hidden = true;
  });

  ui.modal.querySelector("#doneAbout").addEventListener("click", () => {
    ui.modal.hidden = true;
  });

  $("aboutBtn").addEventListener("click", () => {
    ui.modal.hidden = false;
  });

  ui.modal.addEventListener("click", (event) => {
    if (event.target === ui.modal) {
      ui.modal.hidden = true;
    }
  });

  // Mobile sidebar
  $("openSidebar").addEventListener("click", () => {
    ui.sidebar.classList.add("open");
  });

  $("closeSidebar").addEventListener("click", () => {
    ui.sidebar.classList.remove("open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      ui.modal.hidden = true;
      ui.sidebar.classList.remove("open");
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      createChat();
    }
  });

  render();
})();
