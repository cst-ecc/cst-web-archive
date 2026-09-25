(() => {
  const root = document.querySelector("[data-chat-backoffice]");
  if (!root) return;

  const publicId = root.dataset.publicId;
  const canReply = root.dataset.canReply === "1";
  const thread = root.querySelector("[data-chat-thread]");
  const composer = root.querySelector("[data-chat-composer]");
  const textarea = root.querySelector("[data-chat-input]");
  const typing = root.querySelector("[data-remote-typing]");
  const connection = root.querySelector("[data-chat-connection]");
  const connectionLabel = root.querySelector("[data-chat-connection-label]");
  const errorBox = root.querySelector("[data-chat-error]");

  if (!publicId || !thread) return;

  let socket = null;
  let reconnectTimer = null;
  let typingTimer = null;
  let disposed = false;

  const escapeSelector = (value) => {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  };

  const scrollToEnd = (smooth = true) => {
    thread.scrollTo({
      top: thread.scrollHeight,
      behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto",
    });
  };

  const setConnection = (state) => {
    if (connection) connection.dataset.state = state;
    if (!connectionLabel) return;
    connectionLabel.textContent =
      state === "online" ? "Temps réel actif" : state === "connecting" ? "Connexion…" : "Reconnexion…";
  };

  const showError = (message) => {
    if (!errorBox) return;
    errorBox.textContent = message || "";
    errorBox.hidden = !message;
  };

  const send = (payload) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  };

  const messageExists = (id) => Boolean(thread.querySelector(`[data-message-id="${escapeSelector(id)}"]`));

  const createMessage = (message) => {
    if (!message || messageExists(message.id)) return;

    const bubble = document.createElement("div");
    bubble.className = `bo-chat-bubble bo-chat-bubble--${message.sender_type === "membre" ? "member" : "visitor"}`;
    bubble.dataset.messageId = message.id;
    bubble.dataset.sender = message.sender_type;

    const copy = document.createElement("p");
    copy.textContent = message.content;

    const meta = document.createElement("div");
    meta.className = "bo-chat-bubble__meta";
    const time = document.createElement("time");
    const parsed = new Date(message.created_at);
    time.textContent = Number.isNaN(parsed.getTime())
      ? "À l’instant"
      : parsed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    meta.appendChild(time);

    if (message.sender_type === "membre") {
      const receipt = document.createElement("span");
      receipt.className = `bo-chat-receipt${message.is_read ? " is-read" : ""}`;
      receipt.textContent = message.is_read ? "Lu" : "Envoyé";
      meta.appendChild(receipt);
    }

    bubble.append(copy, meta);
    thread.insertBefore(bubble, typing || null);
    scrollToEnd();
  };

  const markRead = (ids) => {
    (ids || []).forEach((id) => {
      const bubble = thread.querySelector(`[data-message-id="${escapeSelector(id)}"][data-sender="membre"]`);
      const receipt = bubble?.querySelector(".bo-chat-receipt");
      if (receipt) {
        receipt.textContent = "Lu";
        receipt.classList.add("is-read");
      }
    });
  };

  const sendRead = () => {
    if (document.visibilityState === "visible") send({ type: "read" });
  };

  const connect = () => {
    if (disposed) return;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    setConnection("connecting");

    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    socket = new WebSocket(`${scheme}://${window.location.host}/ws/backoffice/chat/${publicId}/`);

    socket.addEventListener("open", () => {
      setConnection("online");
      showError("");
      sendRead();
    });

    socket.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(event.data); } catch { return; }

      if (payload.type === "message") {
        createMessage(payload.message);
        if (payload.message?.sender_type === "visiteur" && document.visibilityState === "visible") {
          if (typing) typing.hidden = true;
          sendRead();
        }
        return;
      }

      if (payload.type === "typing" && payload.sender_type === "visiteur") {
        if (typing) typing.hidden = !payload.is_typing;
        if (payload.is_typing) scrollToEnd(false);
        return;
      }

      if (payload.type === "read" && payload.reader_type === "visiteur") {
        markRead(payload.message_ids);
        return;
      }

      if (payload.type === "error") showError(payload.detail || "Action impossible.");
    });

    socket.addEventListener("close", () => {
      setConnection("offline");
      if (typing) typing.hidden = true;
      if (!disposed) reconnectTimer = window.setTimeout(connect, 1800);
    });

    socket.addEventListener("error", () => setConnection("offline"));
  };

  if (composer && textarea && canReply) {
    composer.addEventListener("submit", (event) => {
      const content = textarea.value.trim();
      if (!content) return;
      if (!send({ type: "message", content })) return; // fallback HTTP normal

      event.preventDefault();
      textarea.value = "";
      send({ type: "typing", is_typing: false });
      showError("");
    });

    textarea.addEventListener("input", () => {
      const active = textarea.value.trim().length > 0;
      send({ type: "typing", is_typing: active });
      if (typingTimer) window.clearTimeout(typingTimer);
      typingTimer = window.setTimeout(() => send({ type: "typing", is_typing: false }), 1200);
    });
  }

  document.addEventListener("visibilitychange", sendRead);
  window.addEventListener("beforeunload", () => {
    disposed = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    if (typingTimer) window.clearTimeout(typingTimer);
    socket?.close();
  });

  connect();
  scrollToEnd(false);
})();
