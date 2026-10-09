// Lightweight validation helpers — consistent across forms
export function isRequired(value) {
  return value != null && String(value).trim().length > 0;
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

// Accepts +234..., spaces, dashes; at least 10 digits
export function isPhone(value) {
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function validateCustomer(data) {
  const errors = {};
  if (!isRequired(data.businessName)) errors.businessName = "Business name is required";
  if (!isRequired(data.contactName)) errors.contactName = "Contact name is required";
  if (!isRequired(data.email)) errors.email = "Email is required";
  else if (!isEmail(data.email)) errors.email = "Enter a valid email";
  if (!isRequired(data.phone)) errors.phone = "Phone is required";
  else if (!isPhone(data.phone)) errors.phone = "Enter a valid phone number";
  if (!isRequired(data.dateJoined)) errors.dateJoined = "Date joined is required";
  return errors;
}

// New user — mirrors the API's createUserSchema rules.
export function validateUser(data) {
  const errors = {};
  if (!isRequired(data.name)) errors.name = "Name is required";
  else if (String(data.name).trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (!isRequired(data.email)) errors.email = "Email is required";
  else if (!isEmail(data.email)) errors.email = "Enter a valid email";
  if (!isRequired(data.password)) errors.password = "Password is required";
  else if (String(data.password).length < 8) errors.password = "Password must be at least 8 characters";
  if (isRequired(data.phone) && !isPhone(data.phone)) errors.phone = "Enter a valid phone number";
  if (!isRequired(data.role)) errors.role = "Role is required";
  return errors;
}

// Shipment form — mirrors the API's createShipmentSchema rules.
export function validateShipment(data) {
  const errors = {};
  if (!isRequired(data.customerId)) errors.customerId = "Customer is required";
  if (!isRequired(data.origin)) errors.origin = "Origin is required";
  else if (String(data.origin).trim().length < 2) errors.origin = "Origin must be at least 2 characters";
  if (!isRequired(data.destination)) errors.destination = "Destination is required";
  else if (String(data.destination).trim().length < 2) errors.destination = "Destination must be at least 2 characters";
  const amount = Number(data.amount);
  if (!isRequired(data.amount) || !Number.isFinite(amount) || amount <= 0) errors.amount = "Amount must be greater than 0";
  if (["Assigned", "In Transit", "Delivered"].includes(data.status) && !isRequired(data.driverId)) {
    errors.driverId = "A driver is required for Assigned, In Transit or Delivered status";
  }
  return errors;
}

export function validateDriver(data) {
  const errors = {};
  if (!isRequired(data.name)) errors.name = "Name is required";
  else if (String(data.name).trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (!isRequired(data.phone)) errors.phone = "Phone is required";
  else if (!isPhone(data.phone)) errors.phone = "Enter a valid phone number";
  if (!isRequired(data.email)) errors.email = "Email is required";
  else if (!isEmail(data.email)) errors.email = "Enter a valid email";
  if (!isRequired(data.vehicle)) errors.vehicle = "Vehicle is required";
  else if (String(data.vehicle).trim().length < 2) errors.vehicle = "Vehicle must be at least 2 characters";
  if (isRequired(data.joinedDate) && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.joinedDate))) {
    errors.joinedDate = "joinedDate must be YYYY-MM-DD";
  }
  return errors;
}

export function validateProfile(data) {
  const errors = {};
  if (!isRequired(data.fullName)) errors.fullName = "Full name is required";
  if (!isRequired(data.email)) errors.email = "Email is required";
  else if (!isEmail(data.email)) errors.email = "Enter a valid email";
  if (!isRequired(data.phone)) errors.phone = "Phone is required";
  else if (!isPhone(data.phone)) errors.phone = "Enter a valid phone number";
  return errors;
}

export function validateOrganization(data) {
  const errors = {};
  if (!isRequired(data.companyName)) errors.companyName = "Company name is required";
  if (!isRequired(data.companyEmail)) errors.companyEmail = "Company email is required";
  else if (!isEmail(data.companyEmail)) errors.companyEmail = "Enter a valid email";
  if (data.companyPhone && !isPhone(data.companyPhone)) errors.companyPhone = "Enter a valid phone number";
  return errors;
}
