// User service — internal MoveFlow users with localStorage persistence
import usersSeed from "../data/users";

const STORAGE_KEY = "moveflow_users";

function loadUsers() {
  if (typeof window === "undefined") return [...usersSeed];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...usersSeed];
}

let store = loadUsers();
const listeners = new Set();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getUsers() {
  return store;
}

export function getUserById(id) {
  return store.find((u) => u.id === id) || null;
}

export function updateUser(id, patch) {
  let updated = null;
  store = store.map((u) => {
    if (u.id !== id) return u;
    updated = {
      ...u,
      name: patch.name?.trim() ?? u.name,
      email: patch.email?.trim() ?? u.email,
      phone: patch.phone?.trim() ?? u.phone,
      role: patch.role ?? u.role,
      status: patch.status ?? u.status,
      lastActive: new Date().toISOString().slice(0, 10),
    };
    return updated;
  });
  if (updated) {
    persist();
    notify();
  }
  return updated;
}

// Role permission matrix — frontend-only
export const rolePermissions = {
  Administrator: ["Dashboard", "Shipments", "Customers", "Drivers & Haulers", "Payments", "Users", "Settings"],
  Operations: ["Dashboard", "Shipments", "Customers", "Drivers & Haulers", "Settings"],
  Finance: ["Dashboard", "Payments", "Settings"],
};

export function getPermissionsForRole(role) {
  return rolePermissions[role] || [];
}
