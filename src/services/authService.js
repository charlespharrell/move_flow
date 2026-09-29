// Current user / auth — frontend mock, no real authentication
// Session stored in localStorage; backend will replace later
import { getUserById, getUsers } from "./userService";

const CURRENT_USER_KEY = "moveflow_current_user_id";
const AUTH_KEY = "moveflow_auth";
const DEFAULT_USER_ID = "USR-001";

const listeners = new Set();

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function safeGet(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
}

function safeRemove(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getCurrentUserId() {
  const raw = safeGet(CURRENT_USER_KEY);
  if (raw) return raw;
  return DEFAULT_USER_ID;
}

export function getCurrentUser() {
  const id = getCurrentUserId();
  return getUserById(id) || getUserById(DEFAULT_USER_ID);
}

export function setCurrentUserId(userId) {
  safeSet(CURRENT_USER_KEY, userId);
  // ensure auth flag stays in sync
  const auth = getAuthState();
  if (auth.isAuthenticated) {
    safeSet(AUTH_KEY, JSON.stringify({ ...auth, userId }));
  }
  notify();
}

export function getCurrentUserRole() {
  const user = getCurrentUser();
  return user?.role || "Administrator";
}

// --- Mock session ---

export function getAuthState() {
  const raw = safeGet(AUTH_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.isAuthenticated === "boolean") return parsed;
    } catch {
      // malformed — fallthrough to defaults
    }
  }
  // No session yet — require login (frontend-only auth)
  return { isAuthenticated: false, userId: getCurrentUserId() };
}

export function isAuthenticated() {
  return getAuthState().isAuthenticated;
}

// Frontend-only login: match email against mock users, password must be "password" (demo)
export function login(email, password, remember = false) {
  const normalized = email.trim().toLowerCase();
  const user = getUsers().find((u) => u.email.toLowerCase() === normalized);
  if (!user) {
    return { success: false, error: "No account found with that email." };
  }
  if (user.status === "Inactive") {
    return { success: false, error: "Account is inactive. Contact an administrator." };
  }
  // Demo password — keep simple; any user can log in with "password"
  if (password !== "password") {
    return { success: false, error: "Incorrect password. Hint: use 'password' for demo accounts." };
  }
  const state = { isAuthenticated: true, userId: user.id, remember };
  safeSet(AUTH_KEY, JSON.stringify(state));
  safeSet(CURRENT_USER_KEY, user.id);
  notify();
  return { success: true, user };
}

export function logout() {
  safeRemove(AUTH_KEY);
  // keep current_user_id for next login prefill but clear session
  // Do not delete CURRENT_USER_KEY to preserve last user hint
  notify();
}

export function requireAuth() {
  return isAuthenticated();
}
