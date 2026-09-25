"use client";

const API_ROOT = "/api/v1/communication";

const WS_ROOT = (process.env.NEXT_PUBLIC_WS_URL || "").trim();

function normalizeWebSocketOrigin(value: string): string {
  const trimmed = value.replace(/\/+$/, "");
  if (trimmed.startsWith("https://")) return `wss://${trimmed.slice(8)}`;
  if (trimmed.startsWith("http://")) return `ws://${trimmed.slice(7)}`;
  return trimmed;
}

export function getChatWebSocketUrl(publicId: string, token: string): string {
  if (typeof window === "undefined") {
    throw new Error("WebSocket disponible uniquement dans le navigateur.");
  }

  const fallbackScheme = window.location.protocol === "https:" ? "wss" : "ws";
  const origin = WS_ROOT
    ? normalizeWebSocketOrigin(WS_ROOT)
    : `${fallbackScheme}://${window.location.host}`;

  return `${origin}/ws/chat/${encodeURIComponent(publicId)}/?token=${encodeURIComponent(token)}`;
}

function withTrailingSlash(path: string): string {
  const [pathname, query] = path.split("?", 2);
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${withTrailingSlash(path)}`, {
    ...init,
    // Les endpoints Communication publics ne dépendent jamais de la session
    // Django du back-office. Ne pas envoyer les cookies évite qu'une session
    // staff existante déclenche SessionAuthentication/CSRF côté DRF.
    credentials: "omit",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(init?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "La demande n’a pas pu être traitée.";
    throw new Error(detail);
  }
  return payload as T;
}

export type ContactCategory = { slug: string; name: string };
export type ContactPayload = {
  first_name: string; last_name: string; email: string; phone?: string; subject: string;
  category?: string | null; message: string; consent_acknowledged: boolean; website?: string;
};

export const getContactCategories = () => request<ContactCategory[]>("/contact/categories/");
export const sendContact = (payload: ContactPayload) => request<{ id: number; message: string }>("/contact/", { method: "POST", body: JSON.stringify(payload) });
export const subscribeNewsletter = (email: string, name = "", website = "") => request<{ message: string }>("/newsletter/subscribe/", { method: "POST", body: JSON.stringify({ email, name, website }) });

export type ChatMessage = { id: number; sender_type: "visiteur" | "membre" | "systeme"; content: string; created_at: string; is_read?: boolean };
export type Conversation = { public_id: string; visitor_token: string; visitor_name: string; visitor_email: string; status: string; messages: ChatMessage[] };

export const createConversation = (name: string, email: string, message: string) => request<Conversation>("/chat/conversations/", { method: "POST", body: JSON.stringify({ name, email, message }) });
export const getConversation = (publicId: string, token: string) => request<Conversation>(`/chat/conversations/${publicId}/`, { headers: { "X-Conversation-Token": token } });
export const sendChatMessage = (publicId: string, token: string, message: string) => request<{ id: number; created_at: string }>(`/chat/conversations/${publicId}/`, { method: "POST", headers: { "X-Conversation-Token": token }, body: JSON.stringify({ message }) });
