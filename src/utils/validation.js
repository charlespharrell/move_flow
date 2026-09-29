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

export function validateDriver(data) {
  const errors = {};
  if (!isRequired(data.name)) errors.name = "Name is required";
  if (!isRequired(data.phone)) errors.phone = "Phone is required";
  else if (!isPhone(data.phone)) errors.phone = "Enter a valid phone number";
  if (!isRequired(data.email)) errors.email = "Email is required";
  else if (!isEmail(data.email)) errors.email = "Enter a valid email";
  if (!isRequired(data.vehicle)) errors.vehicle = "Vehicle is required";
  if (!isRequired(data.joinedDate)) errors.joinedDate = "Joined date is required";
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
