// Settings persistence — profile / organization / notifications / security (frontend only)

const PROFILE_KEY = "moveflow_settings_profile";
const ORG_KEY = "moveflow_settings_org";
const NOTIF_KEY = "moveflow_settings_notifications";

// Default profile derived from current user — fallback values
const defaultProfile = {
  fullName: "Ada Lovelace",
  email: "ada@moveflow.ng",
  phone: "+234 801 900 0001",
};

const defaultOrganization = {
  companyName: "MoveFlow Logistics",
  companyEmail: "ops@moveflow.ng",
  companyPhone: "+234 800 000 0000",
  address: "12 Marina Street, Lagos, Nigeria",
};

const defaultNotifications = {
  shipment: true,
  payment: true,
  system: false,
  email: true,
};

function load(key, fallback) {
  if (typeof window === "undefined") return { ...fallback };
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...fallback };
}

function save(key, data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getProfile() {
  return load(PROFILE_KEY, defaultProfile);
}

export function saveProfile(data) {
  const next = {
    fullName: data.fullName?.trim() || defaultProfile.fullName,
    email: data.email?.trim() || defaultProfile.email,
    phone: data.phone?.trim() || defaultProfile.phone,
  };
  save(PROFILE_KEY, next);
  return next;
}

export function getOrganization() {
  return load(ORG_KEY, defaultOrganization);
}

export function saveOrganization(data) {
  const next = {
    companyName: data.companyName?.trim() || defaultOrganization.companyName,
    companyEmail: data.companyEmail?.trim() || defaultOrganization.companyEmail,
    companyPhone: data.companyPhone?.trim() || defaultOrganization.companyPhone,
    address: data.address?.trim() || defaultOrganization.address,
  };
  save(ORG_KEY, next);
  return next;
}

export function getNotifications() {
  return load(NOTIF_KEY, defaultNotifications);
}

export function saveNotifications(data) {
  const next = {
    shipment: !!data.shipment,
    payment: !!data.payment,
    system: !!data.system,
    email: !!data.email,
  };
  save(NOTIF_KEY, next);
  return next;
}
