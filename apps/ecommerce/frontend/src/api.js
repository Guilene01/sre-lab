import { uuid } from "./uuid";

function sessionId() {
  let id = localStorage.getItem("norr_session_id");
  if (!id) {
    id = uuid();
    localStorage.setItem("norr_session_id", id);
  }
  return id;
}

export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function formatPrice(cents) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
