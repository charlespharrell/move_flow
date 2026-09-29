import { useState, useEffect } from "react";
import { Input, Select } from "./ui/Input";
import Button from "./ui/Button";
import { validateCustomer } from "../utils/validation";

// Customer add/edit form — dark theme, validation, accessible labels
export default function CustomerForm({ initialData, onSubmit, onCancel, submitLabel = "Save Customer" }) {
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    status: "Active",
    dateJoined: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState({});

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line -- prefill edit form from prop
      setForm({
        businessName: initialData.businessName || "",
        contactName: initialData.contactName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        status: initialData.status || "Active",
        dateJoined: initialData.dateJoined || new Date().toISOString().slice(0, 10),
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = validateCustomer(form);
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
        <label htmlFor="businessName" className="mb-1 block text-xs font-medium text-zinc-300">
          Business Name <span className="text-red-400">*</span>
        </label>
        <Input id="businessName" name="businessName" value={form.businessName} onChange={handleChange} placeholder="Acme Foods" />
        {errors.businessName && <p className="mt-1 text-xs text-red-400">{errors.businessName}</p>}
      </div>

      <div>
        <label htmlFor="contactName" className="mb-1 block text-xs font-medium text-zinc-300">
          Contact Name <span className="text-red-400">*</span>
        </label>
        <Input id="contactName" name="contactName" value={form.contactName} onChange={handleChange} placeholder="Grace Adeyemi" />
        {errors.contactName && <p className="mt-1 text-xs text-red-400">{errors.contactName}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-zinc-300">
            Email <span className="text-red-400">*</span>
          </label>
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="grace@acmefoods.ng" />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-xs font-medium text-zinc-300">
            Phone <span className="text-red-400">*</span>
          </label>
          <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+234 801 234 0000" />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-zinc-300">
            Account Status
          </label>
          <Select id="status" name="status" value={form.status} onChange={handleChange} className="w-full">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
        <div>
          <label htmlFor="dateJoined" className="mb-1 block text-xs font-medium text-zinc-300">
            Date Joined <span className="text-red-400">*</span>
          </label>
          <Input id="dateJoined" name="dateJoined" type="date" value={form.dateJoined} onChange={handleChange} />
          {errors.dateJoined && <p className="mt-1 text-xs text-red-400">{errors.dateJoined}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
