import { useState, useEffect } from "react";
import { Input, Select } from "./ui/Input";
import Button from "./ui/Button";
import { validateDriver } from "../utils/validation";

// Driver / Hauler add/edit form — dark theme, validation, accessible labels
export default function DriverForm({ initialData, onSubmit, onCancel, submitting = false, submitLabel = "Save Driver" }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    vehicleType: "Truck",
    licenseStatus: "Valid",
    verificationStatus: "Pending",
    status: "Available",
    joinedDate: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState({});

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line -- prefill edit form from prop
      setForm({
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        vehicle: initialData.vehicle || "",
        vehicleType: initialData.vehicleType || "Truck",
        licenseStatus: initialData.licenseStatus || "Valid",
        verificationStatus: initialData.verificationStatus || "Pending",
        status: initialData.status || "Available",
        joinedDate: initialData.joinedDate || new Date().toISOString().slice(0, 10),
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = validateDriver(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="driver-name" className="mb-1 block text-xs font-medium text-zinc-300">
          Name <span className="text-red-400">*</span>
        </label>
        <Input id="driver-name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="driver-phone" className="mb-1 block text-xs font-medium text-zinc-300">
            Phone <span className="text-red-400">*</span>
          </label>
          <Input id="driver-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+234 803 100 0000" />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="driver-email" className="mb-1 block text-xs font-medium text-zinc-300">
            Email <span className="text-red-400">*</span>
          </label>
          <Input id="driver-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="john.doe@moveflow.ng" />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="driver-vehicle" className="mb-1 block text-xs font-medium text-zinc-300">
            Vehicle <span className="text-red-400">*</span>
          </label>
          <Input id="driver-vehicle" name="vehicle" value={form.vehicle} onChange={handleChange} placeholder="Truck — LA-842-XA" />
          {errors.vehicle && <p className="mt-1 text-xs text-red-400">{errors.vehicle}</p>}
        </div>
        <div>
          <label htmlFor="vehicleType" className="mb-1 block text-xs font-medium text-zinc-300">
            Vehicle Type
          </label>
          <Select id="vehicleType" name="vehicleType" value={form.vehicleType} onChange={handleChange} className="w-full">
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="licenseStatus" className="mb-1 block text-xs font-medium text-zinc-300">
            License Status
          </label>
          <Select id="licenseStatus" name="licenseStatus" value={form.licenseStatus} onChange={handleChange} className="w-full">
            <option value="Valid">Valid</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </Select>
        </div>
        <div>
          <label htmlFor="verificationStatus" className="mb-1 block text-xs font-medium text-zinc-300">
            Verification
          </label>
          <Select id="verificationStatus" name="verificationStatus" value={form.verificationStatus} onChange={handleChange} className="w-full">
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="driver-status" className="mb-1 block text-xs font-medium text-zinc-300">
            Availability
          </label>
          <Select id="driver-status" name="status" value={form.status} onChange={handleChange} className="w-full">
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Offline">Offline</option>
          </Select>
        </div>
        <div>
          <label htmlFor="joinedDate" className="mb-1 block text-xs font-medium text-zinc-300">
            Joined Date <span className="text-red-400">*</span>
          </label>
          <Input id="joinedDate" name="joinedDate" type="date" value={form.joinedDate} onChange={handleChange} />
          {errors.joinedDate && <p className="mt-1 text-xs text-red-400">{errors.joinedDate}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
