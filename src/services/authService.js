// Real authentication against the MoveFlow API (JWT bearer tokens).
//
// The session store keeps the same module-level + subscribe() shape the other
// MoveFlow services use, so components can re-render via useAuth() without a
// state-management library.
import { api, setUnauthorizedHandler, AUTH_STORAGE_KEY } from "./api.js";

const listeners = new Set();

// status: "anonymous" | "restoring" | "authenticated"
let state = { status: "anonymous", user: null };

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribeAuth(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Must be referentially stable between changes — useSyncExternalStore needs it. */
export function getAuthSnapshot() {
  return state;
}

function storageFor(remember) {
  if (typeof window === "undefined") return null;
  return remember ? window.localStorage : window.sessionStorage;
}

function clearStorage() {
  if (typeof window === "undefined") return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      store.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    for (const store of [window.localStorage, window.sessionStorage]) {
      const raw = store.getItem(AUTH_STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.token === "string" && parsed.user) {
        state = { status: "authenticated", user: parsed.user };
        return;
      }
    }
  } catch {
    // fall through to anonymous
  }
  state = { status: "anonymous", user: null };
}

hydrate();

function setState(next) {
  state = next;
  notify();
}

export function setSession(token, user, remember = true) {
  const store = storageFor(remember);
  try {
    store?.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user, remember }));
  } catch {
    // ignore quota errors
  }
  setState({ status: "authenticated", user });
}

export function clearSession() {
  clearStorage();
  setState({ status: "anonymous", user: null });
}

export function isAuthenticated() {
  return state.status === "authenticated";
}

export function getCurrentUser() {
  return state.user;
}

export function getCurrentUserRole() {
  return state.user?.role || null;
}

/** POST /auth/login — throws ApiError with the server message on failure. */
export async function login(email, password, remember = true) {
  const data = await api.post("/auth/login", { email: email.trim(), password }, { auth: false });
  setSession(data.token, data.user, remember);
  return data.user;
}

/**
 * POST /auth/logout — the server cannot revoke a stateless JWT, so this only
 * acknowledges the sign-out; discarding the token is what actually ends the
 * session locally.
 */
export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Even if the call fails the local session must be cleared.
  } finally {
    clearSession();
  }
}

/** GET /auth/me — used to restore and revalidate a session on startup. */
export async function fetchCurrentUser() {
  const data = await api.get("/auth/me");
  return data.user;
}

let initPromise = null;

/**
 * Runs at most once per page load. Verifies a stored token against /auth/me so
 * an expired or tampered token does not leave the app in a half-authenticated
 * state. Guarded by initPromise so React StrictMode double-effects in
 * development do not produce duplicate requests.
 */
export function initializeAuth() {
  if (initPromise) return initPromise;

  if (state.status !== "authenticated") {
    initPromise = Promise.resolve(state);
    return initPromise;
  }

  setState({ status: "restoring", user: state.user });

  initPromise = fetchCurrentUser()
    .then((user) => {
      setState({ status: "authenticated", user });
      return state;
    })
    .catch(() => {
      // Invalid or expired token: drop it and send the user back to login.
      clearSession();
      return state;
    });

  return initPromise;
}

// Any 401 from the API layer invalidates the local session.
setUnauthorizedHandler(() => {
  if (state.status !== "anonymous") clearSession();
});