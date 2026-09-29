// Driver / Hauler service — mock layer with localStorage persistence
import driversSeed from "../data/drivers";
import shipments from "../data/shipments";

const STORAGE_KEY = "moveflow_drivers";

function loadDrivers() {
  if (typeof window === "undefined") return [...driversSeed];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...driversSeed];
}

let store = loadDrivers();
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

function generateId() {
  const max = store.reduce((m, d) => {
    const n = parseInt(d.id.split("-")[1] || "0", 10);
    return n > m ? n : m;
  }, 0);
  return `DRV-${String(max + 1).padStart(3, "0")}`;
}

export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getDrivers() {
  return store;
}

export function getDriverById(id) {
  return store.find((d) => d.id === id) || null;
}

export function addDriver(data) {
  const driver = {
    id: generateId(),
    name: data.name?.trim() || "",
    phone: data.phone?.trim() || "",
    email: data.email?.trim() || "",
    vehicle: data.vehicle?.trim() || "",
    vehicleType: data.vehicleType || "Truck",
    licenseStatus: data.licenseStatus || "Valid",
    verificationStatus: data.verificationStatus || "Pending",
    status: data.status || "Available",
    currentShipmentId: null,
    joinedDate: data.joinedDate || new Date().toISOString().slice(0, 10),
  };
  store = [driver, ...store];
  persist();
  notify();
  return driver;
}

export function updateDriver(id, patch) {
  let updated = null;
  store = store.map((d) => {
    if (d.id !== id) return d;
    updated = {
      ...d,
      name: patch.name?.trim() ?? d.name,
      phone: patch.phone?.trim() ?? d.phone,
      email: patch.email?.trim() ?? d.email,
      vehicle: patch.vehicle?.trim() ?? d.vehicle,
      vehicleType: patch.vehicleType ?? d.vehicleType,
      licenseStatus: patch.licenseStatus ?? d.licenseStatus,
      verificationStatus: patch.verificationStatus ?? d.verificationStatus,
      status: patch.status ?? d.status,
      joinedDate: patch.joinedDate ?? d.joinedDate,
      // preserve currentShipmentId unless explicitly changed
      currentShipmentId: patch.currentShipmentId !== undefined ? patch.currentShipmentId : d.currentShipmentId,
    };
    return updated;
  });
  if (updated) {
    persist();
    notify();
  }
  return updated;
}

// Shipments for a driver
export function getDriverShipments(driverId) {
  return shipments.filter((s) => s.driverId === driverId);
}

// Current active shipment (Assigned / In Transit) — prefer stored currentShipmentId if valid
export function getCurrentDriverShipment(driverId) {
  const driver = getDriverById(driverId);
  if (!driver) return null;
  if (driver.currentShipmentId) {
    const s = shipments.find((x) => x.id === driver.currentShipmentId);
    if (s && ["Assigned", "In Transit"].includes(s.status)) return s;
  }
  // Fallback: first active shipment for this driver
  return shipments.find((s) => s.driverId === driverId && ["Assigned", "In Transit"].includes(s.status)) || null;
}

export function getDriverStats(driverId) {
  const all = getDriverShipments(driverId);
  const active = all.filter((s) => ["Assigned", "In Transit"].includes(s.status)).length;
  const completed = all.filter((s) => s.status === "Delivered").length;
  const totalValue = all.reduce((sum, s) => sum + s.amount, 0);
  return {
    total: all.length,
    active,
    completed,
    totalValue,
  };
}
