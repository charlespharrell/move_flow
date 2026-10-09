import { useState } from "react";
import { Input, Select } from "./ui/Input";
import Button from "./ui/Button";
import { validateUser } from "../utils/validation";

// New user form — dark theme, validation, accessible labels.
// Passwords are only sent to the API on create; it is never stored client-side.
export default function UserForm({ onSubmit, onCancel, submitting = false, submitLabel = "Create User" }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "Operations",
    status: "Active",
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = validateUser(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      role: form.role,
      status: form.status,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="user-name" className="mb-1 block text-xs font-medium text-zinc-300">
          Full Name <span className="text-red-400">*</span>
        </label>
        <Input id="user-name" name="name" value={form.name} onChange={handleChange} placeholder="Ada Lovelace" autoComplete="off" />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="user-email" className="mb-1 block text-xs font-medium text-zinc-300">
            Email <span className="text-red-400">*</span>
          </label>
          <Input id="user-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@moveflow.local" autoComplete="off" />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="user-phone" className="mb-1 block text-xs font-medium text-zinc-300">
            Phone
          </label>
          <Input id="user-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+234 801 234 0000" autoComplete="off" />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="user-password" className="mb-1 block text-xs font-medium text-zinc-300">
          Password <span className="text-red-400">*</span>
        </label>
        <Input
          id="user-password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="user-role" className="mb-1 block text-xs font-medium text-zinc-300">
            Role <span className="text-red-400">*</span>
          </label>
          <Select id="user-role" name="role" value={form.role} onChange={handleChange} className="w-full">
            <option value="Administrator">Administrator</option>
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
          </Select>
          {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role}</p>}
        </div>
        <div>
          <label htmlFor="user-status" className="mb-1 block text-xs font-medium text-zinc-300">
            Status
          </label>
          <Select id="user-status" name="status" value={form.status} onChange={handleChange} className="w-full">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
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
