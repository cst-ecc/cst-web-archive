"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChatMessage,
  Conversation,
  createConversation,
  getConversation,
  getChatWebSocketUrl,
  sendChatMessage,
} from "@/lib/communication";
import styles from "./ChatWidget.module.scss";

const STORAGE_KEY = "cst-chat-session";
const TYPING_IDLE_MS = 1200;

type Stored = { publicId: string; token: string };
type SocketState = "connecting" | "online" | "offline";
type RealtimeEvent =
  | { type: "ready" }
  | { type: "message"; message: ChatMessage }
  | {
      type: "typing";
      sender_type: "visiteur" | "membre" | "systeme";
      is_typing: boolean;
    }
  | {
      type: "read";
      reader_type: "visiteur" | "membre";
      message_ids: number[];
    }
  | { type: "error"; detail: string };

function mergeMessage(messages: ChatMessage[], incoming: ChatMessage) {
  if (messages.some((item) => item.id === incoming.id)) return messages;
  return [...messages, incoming];
}

function retireSocket(ws: WebSocket | null) {
  if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
    return;
  }

  // En mode React StrictMode, un effet peut être nettoyé immédiatement après
  // son premier montage. Fermer un WebSocket encore CONNECTING déclenche le
  // warning navigateur « closed before the connection is established ».
  if (ws.readyState === WebSocket.CONNECTING) {
    ws.addEventListener(
      "open",
      () => {
        if (ws.readyState === WebSocket.OPEN) ws.close(1000, "replaced");
      },
      { once: true },
    );
    return;
  }

  ws.close(1000, "replaced");
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socketState, setSocketState] = useState<SocketState>("offline");
  const [memberTyping, setMemberTyping] = useState(false);

  const socket = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const typingTimer = useRef<number | null>(null);
  const disposed = useRef(false);
  const openRef = useRef(false);
  const conversationRef = useRef<Conversation | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const sendSocket = useCallback((payload: object) => {
    if (socket.current?.readyState !== WebSocket.OPEN) return false;
    socket.current.send(JSON.stringify(payload));
    return true;
  }, []);

  const markMemberMessagesRead = useCallback(() => {
    if (!openRef.current || document.visibilityState !== "visible") return;
    const current = conversationRef.current;
    if (!current?.messages.some((item) => item.sender_type === "membre" && !item.is_read)) {
      return;
    }
    sendSocket({ type: "read" });
  }, [sendSocket]);

  const connect = useCallback(
    (publicId: string, token: string) => {
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      const socketUrl = getChatWebSocketUrl(publicId, token);
      const previous = socket.current;

      if (
        previous &&
        previous.url === socketUrl &&
        (previous.readyState === WebSocket.CONNECTING || previous.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      socket.current = null;
      retireSocket(previous);
      setSocketState("connecting");

      const ws = new WebSocket(socketUrl);
      socket.current = ws;

      ws.onopen = () => {
        setSocketState("online");
        setError("");
        markMemberMessagesRead();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimeEvent;

          if (payload.type === "message") {
            setConversation((current) =>
              current
                ? {
                    ...current,
                    messages: mergeMessage(current.messages, payload.message),
                  }
                : current,
            );
            if (payload.message.sender_type === "membre") {
              setMemberTyping(false);
              window.setTimeout(markMemberMessagesRead, 0);
            }
            return;
          }

          if (payload.type === "typing" && payload.sender_type === "membre") {
            setMemberTyping(payload.is_typing);
            return;
          }

          if (payload.type === "read" && payload.reader_type === "membre") {
            const ids = new Set(payload.message_ids);
            setConversation((current) =>
              current
                ? {
                    ...current,
                    messages: current.messages.map((message) =>
                      ids.has(message.id) ? { ...message, is_read: true } : message,
                    ),
                  }
                : current,
            );
            return;
          }

          if (payload.type === "error") {
            setError(payload.detail);
          }
        } catch {
          // Une trame invalide ne doit jamais casser le widget.
        }
      };

      ws.onerror = () => {
        if (socket.current === ws) setSocketState("offline");
      };
      ws.onclose = () => {
        if (socket.current !== ws) return;
        socket.current = null;
        setSocketState("offline");
        setMemberTyping(false);
        if (!disposed.current && conversationRef.current) {
          reconnectTimer.current = window.setTimeout(
            () => connect(publicId, token),
            1800,
          );
        }
      };
    },
    [markMemberMessagesRead],
  );

  useEffect(() => {
    disposed.current = false;
    let active = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Stored;
        getConversation(saved.publicId, saved.token)
          .then((current) => {
            if (!active) return;
            setConversation(current);
            conversationRef.current = current;
            connect(saved.publicId, saved.token);
          })
          .catch(() => {
            if (active) localStorage.removeItem(STORAGE_KEY);
          });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    return () => {
      active = false;
      disposed.current = true;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      const current = socket.current;
      socket.current = null;
      retireSocket(current);
    };
  }, [connect]);

  useEffect(() => {
    if (!open) return;
    markMemberMessagesRead();
  }, [open, conversation?.messages.length, markMemberMessagesRead]);

  useEffect(() => {
    const onVisibility = () => markMemberMessagesRead();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [markMemberMessagesRead]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [conversation?.messages.length, memberTyping, open, reduced]);

  async function start(event: FormEvent) {
    event.preventDefault();
    if (draft.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const current = await createConversation(name, email, draft);
      setConversation(current);
      conversationRef.current = current;
      setDraft("");
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ publicId: current.public_id, token: current.visitor_token }),
      );
      connect(current.public_id, current.visitor_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversation impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const current = conversationRef.current;
    const value = draft.trim();
    if (!current || !value) return;

    setDraft("");
    setError("");
    sendSocket({ type: "typing", is_typing: false });

    if (sendSocket({ type: "message", content: value })) return;

    try {
      await sendChatMessage(current.public_id, current.visitor_token, value);
      const refreshed = await getConversation(current.public_id, current.visitor_token);
      setConversation(refreshed);
    } catch (err) {
      setDraft(value);
      setError(err instanceof Error ? err.message : "Message non envoyé.");
    }
  }

  function updateDraft(value: string) {
    setDraft(value);
    if (!conversationRef.current || socket.current?.readyState !== WebSocket.OPEN) return;

    sendSocket({ type: "typing", is_typing: value.trim().length > 0 });
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      sendSocket({ type: "typing", is_typing: false });
    }, TYPING_IDLE_MS);
  }

  const closed =
    conversation && ["fermee", "archivee"].includes(conversation.status);

  return (
    <>
      <button
        className={styles.launcher}
        aria-label="Ouvrir la messagerie"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.launcherIcon} aria-hidden="true">💬</span>
        <span>Une question ?</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            className={styles.panel}
            initial={reduced ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            aria-label="Messagerie CST/CSMo"
          >
            <header className={styles.header}>
              <div>
                <strong>Une question ?</strong>
                <span>Nous sommes à votre écoute</span>
                {conversation && (
                  <small className={styles.connection} data-state={socketState}>
                    <i aria-hidden="true" />
                    {socketState === "online"
                      ? "Temps réel actif"
                      : socketState === "connecting"
                        ? "Connexion…"
                        : "Reconnexion…"}
                  </small>
                )}
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            </header>

            {!conversation ? (
              <form className={styles.startForm} onSubmit={start}>
                <p>
                  Envoyez votre message. Il restera enregistré même si aucun
                  opérateur n’est disponible immédiatement.
                </p>
                <input
                  placeholder="Votre nom (optionnel)"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={160}
                />
                <input
                  type="email"
                  placeholder="Votre e-mail (optionnel)"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                />
                <textarea
                  required
                  minLength={2}
                  maxLength={3000}
                  rows={5}
                  placeholder="Écrivez votre message…"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button disabled={loading}>
                  {loading ? "Envoi…" : "Démarrer la conversation"}
                </button>
                {error && <small className={styles.error}>{error}</small>}
              </form>
            ) : (
              <>
                <div className={styles.messages} ref={threadRef} aria-live="polite">
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.sender_type === "visiteur"
                          ? styles.visitor
                          : styles.member
                      }
                    >
                      <p>{message.content}</p>
                      <div className={styles.messageMeta}>
                        <time>
                          {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                        {message.sender_type === "visiteur" && (
                          <span className={message.is_read ? styles.read : ""}>
                            {message.is_read ? "Lu" : "Envoyé"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  <AnimatePresence>
                    {memberTyping && (
                      <motion.div
                        className={styles.typing}
                        initial={reduced ? false : { opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <span /><span /><span />
                        <small>Un membre écrit…</small>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {closed ? (
                  <div className={styles.closed}>
                    Cette conversation est fermée. Vous pouvez supprimer la
                    session locale pour en démarrer une nouvelle.
                  </div>
                ) : (
                  <form className={styles.composer} onSubmit={send}>
                    <textarea
                      aria-label="Votre message"
                      rows={2}
                      maxLength={3000}
                      value={draft}
                      onChange={(event) => updateDraft(event.target.value)}
                      placeholder="Écrivez votre message…"
                    />
                    <button aria-label="Envoyer" disabled={!draft.trim()}>
                      ➤
                    </button>
                  </form>
                )}
                {error && <small className={styles.error}>{error}</small>}
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
