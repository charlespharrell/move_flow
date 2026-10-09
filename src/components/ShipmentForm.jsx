import { useState, useEffect } from "react";
import { Input, Select } from "./ui/Input";
import Button from "./ui/Button";
import { validateShipment } from "../utils/validation";

// Shipment add/edit form — dark theme, validation, accessible labels.
// `customers`/`drivers` are the reference lists fetched from the API.
export default function ShipmentForm({
  customers = [],
  drivers = [],
  initialData,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Save Shipment",
}) {
  const [form, setForm] = useState({
    customerId: "",
    driverId: "",
    vehicle: "",
    status: "Pending",
    origin: "",
    destination: "",
    currentLocation: "",
    amount: "",
    pickupDate: "",
    expectedDeliveryDate: "",
    actualDeliveryDate: "",
  });
  const [errors, setErrors] = useState({});

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line -- prefill edit form from prop
      setForm({
        customerId: initialData.customerId || "",
        driverId: initialData.driverId || "",
        vehicle: initialData.vehicle || "",
        status: initialData.status || "Pending",
        origin: initialData.origin || "",
        destination: initialData.destination || "",
        currentLocation: initialData.currentLocation || "",
        amount: initialData.amount != null ? String(initialData.amount) : "",
        pickupDate: initialData.pickupDate || "",
        expectedDeliveryDate: initialData.expectedDeliveryDate || "",
        actualDeliveryDate: initialData.actualDeliveryDate || "",
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = validateShipment(form);
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="customerId" className="mb-1 block text-xs font-medium text-zinc-300">
            Customer <span className="text-red-400">*</span>
          </label>
          <Select id="customerId" name="customerId" value={form.customerId} onChange={handleChange} className="w-full">
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.businessName} ({c.id})
              </option>
            ))}
          </Select>
          {errors.customerId && <p className="mt-1 text-xs text-red-400">{errors.customerId}</p>}
        </div>

        <div>
          <label htmlFor="driverId" className="mb-1 block text-xs font-medium text-zinc-300">
            Driver
          </label>
          <Select id="driverId" name="driverId" value={form.driverId} onChange={handleChange} className="w-full">
            <option value="">Unassigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.vehicleType}
              </option>
            ))}
          </Select>
          {errors.driverId && <p className="mt-1 text-xs text-red-400">{errors.driverId}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="origin" className="mb-1 block text-xs font-medium text-zinc-300">
            Origin <span className="text-red-400">*</span>
          </label>
          <Input id="origin" name="origin" value={form.origin} onChange={handleChange} placeholder="Lagos" />
          {errors.origin && <p className="mt-1 text-xs text-red-400">{errors.origin}</p>}
        </div>
        <div>
          <label htmlFor="destination" className="mb-1 block text-xs font-medium text-zinc-300">
            Destination <span className="text-red-400">*</span>
          </label>
          <Input id="destination" name="destination" value={form.destination} onChange={handleChange} placeholder="Abuja" />
          {errors.destination && <p className="mt-1 text-xs text-red-400">{errors.destination}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-zinc-300">
            Status
          </label>
          <Select id="status" name="status" value={form.status} onChange={handleChange} className="w-full">
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block text-xs font-medium text-zinc-300">
            Amount (₦) <span className="text-red-400">*</span>
          </label>
          <Input id="amount" name="amount" type="number" min="0.01" step="any" value={form.amount} onChange={handleChange} placeholder="185000" />
          {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vehicle" className="mb-1 block text-xs font-medium text-zinc-300">
            Vehicle
          </label>
          <Input id="vehicle" name="vehicle" value={form.vehicle} onChange={handleChange} placeholder="Truck — LA-842-XA" />
        </div>
        <div>
          <label htmlFor="currentLocation" className="mb-1 block text-xs font-medium text-zinc-300">
            Current Location
          </label>
          <Input id="currentLocation" name="currentLocation" value={form.currentLocation} onChange={handleChange} placeholder="Lokoja — Kogi State" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="pickupDate" className="mb-1 block text-xs font-medium text-zinc-300">
            Pickup Date
          </label>
          <Input id="pickupDate" name="pickupDate" type="date" value={form.pickupDate} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="expectedDeliveryDate" className="mb-1 block text-xs font-medium text-zinc-300">
            Expected Delivery
          </label>
          <Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" value={form.expectedDeliveryDate} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="actualDeliveryDate" className="mb-1 block text-xs font-medium text-zinc-300">
            Actual Delivery
          </label>
          <Input id="actualDeliveryDate" name="actualDeliveryDate" type="date" value={form.actualDeliveryDate} onChange={handleChange} />
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