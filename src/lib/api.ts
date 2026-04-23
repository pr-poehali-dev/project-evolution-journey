import func2url from "../../backend/func2url.json";

const API = func2url.register;

export async function apiGet(action: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${API}?${query}`);
  return res.json();
}

export async function apiPost(action: string, body: Record<string, unknown> = {}) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}
