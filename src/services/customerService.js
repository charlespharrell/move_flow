// Customer service — mock layer with localStorage persistence
import customersSeed from "../data/customers";
import shipments from "../data/shipments";

const STORAGE_KEY = "moveflow_customers";

// Load from localStorage or seed; do not overwrite existing data on load
function loadCustomers() {
  if (typeof window === "undefined") return [...customersSeed];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [...customersSeed];
}

let store = loadCustomers();
const listeners = new Set();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota or unavailable — ignore
  }
}

function notify() {
  listeners.forEach((cb) => cb());
}

function generateId() {
  // Find max numeric suffix to avoid collisions
  const max = store.reduce((m, c) => {
    const n = parseInt(c.id.split("-")[1] || "0", 10);
    return n > m ? n : m;
  }, 0);
  return `CUST-${String(max + 1).padStart(3, "0")}`;
}

export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getCustomers() {
  return store;
}

export function getCustomerById(id) {
  return store.find((c) => c.id === id) || null;
}

// Add new customer — generates unique ID
export function addCustomer(data) {
  const customer = {
    id: generateId(),
    businessName: data.businessName?.trim() || "",
    contactName: data.contactName?.trim() || "",
    email: data.email?.trim() || "",
    phone: data.phone?.trim() || "",
    status: data.status || "Active",
    dateJoined: data.dateJoined || new Date().toISOString().slice(0, 10),
  };
  store = [customer, ...store];
  persist();
  notify();
  return customer;
}

// Update existing — preserves id
export function updateCustomer(id, patch) {
  let updated = null;
  store = store.map((c) => {
    if (c.id !== id) return c;
    updated = {
      ...c,
      businessName: patch.businessName?.trim() ?? c.businessName,
      contactName: patch.contactName?.trim() ?? c.contactName,
      email: patch.email?.trim() ?? c.email,
      phone: patch.phone?.trim() ?? c.phone,
      status: patch.status ?? c.status,
      dateJoined: patch.dateJoined ?? c.dateJoined,
    };
    return updated;
  });
  if (updated) {
    persist();
    notify();
  }
  return updated;
}

// Shipments belonging to a customer
export function getCustomerShipments(customerId) {
  return shipments.filter((s) => s.customerId === customerId);
}

// Derived stats for a customer
export function getCustomerStats(customerId) {
  const all = getCustomerShipments(customerId);
  const active = all.filter((s) => ["Assigned", "In Transit"].includes(s.status)).length;
  const delivered = all.filter((s) => s.status === "Delivered").length;
  const totalSpending = all.reduce((sum, s) => sum + s.amount, 0);
  return {
    total: all.length,
    active,
    delivered,
    totalSpending,
  };
}
