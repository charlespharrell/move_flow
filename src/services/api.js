// Single place where the frontend talks to the MoveFlow API. Components import
// `api` rather than calling fetch() directly, so base URL, auth header and
// response unwrapping stay consistent.
const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const AUTH_STORAGE_KEY = "moveflow_session";

export class ApiError extends Error {
  constructor(message, { status = 0, errors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/** Reads the JWT from either storage bucket, honouring "remember me". */
export function getStoredToken() {
  if (typeof window === "undefined") return null;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = store.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.token === "string") return parsed.token;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return null;
}

let unauthorizedHandler = null;

/** Registered by authService so a 401 can clear the session in one place. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Cannot reach the MoveFlow API. Is the backend running?", { status: 0 });
  }

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  // The API contract is { success, data, message } on success and
  // { success, message, errors? } on failure.
  if (response.ok && payload && payload.success) return payload.data;

  // A 401 on an authenticated call means the session is no longer usable.
  if (response.status === 401 && auth) unauthorizedHandler?.();

  throw new ApiError(payload?.message || `Request failed with status ${response.status}`, {
    status: response.status,
    errors: payload?.errors,
  });
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body: body ?? {} }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body: body ?? {} }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
  query: queryString,
};

export default api;