import { useState } from "react";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { getProfile, saveProfile, getOrganization, saveOrganization, getNotifications, saveNotifications } from "../services/settingsService";
import { validateProfile, validateOrganization } from "../utils/validation";
import { useToast } from "../components/ui/Toast";

function Toggle({ enabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        enabled ? "bg-blue-600 border-blue-600" : "bg-zinc-700 border-zinc-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const tabs = ["Profile", "Organization", "Notifications", "Security"];

  // Profile state
  const [profile, setProfile] = useState(() => getProfile());
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaved, setProfileSaved] = useState(false);

  // Organization state
  const [org, setOrg] = useState(() => getOrganization());
  const [orgErrors, setOrgErrors] = useState({});
  const [orgSaved, setOrgSaved] = useState(false);

  // Notifications state
  const [notif, setNotif] = useState(() => getNotifications());
  const [notifSaved, setNotifSaved] = useState(false);

  // Security — frontend only
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaved, setPwSaved] = useState(false);
  const { addToast } = useToast();

  function handleProfileSave(e) {
    e.preventDefault();
    const errs = validateProfile(profile);
    setProfileErrors(errs);
    if (Object.keys(errs).length) return;
    saveProfile(profile);
    setProfileSaved(true);
    addToast("Profile saved", "success");
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function handleOrgSave(e) {
    e.preventDefault();
    const errs = validateOrganization(org);
    setOrgErrors(errs);
    if (Object.keys(errs).length) {
      if (errs.companyPhone) setOrgErrors((prev) => ({ ...prev, companyPhone: errs.companyPhone }));
      return;
    }
    saveOrganization(org);
    setOrgSaved(true);
    addToast("Organization saved", "success");
    setTimeout(() => setOrgSaved(false), 2000);
  }

  function handleNotifSave() {
    saveNotifications(notif);
    setNotifSaved(true);
    addToast("Notification preferences saved", "success");
    setTimeout(() => setNotifSaved(false), 2000);
  }

  function handlePasswordSave(e) {
    e.preventDefault();
    const errs = {};
    if (!pw.next) errs.next = "New password is required";
    else if (pw.next.length < 6) errs.next = "At least 6 characters";
    if (pw.next !== pw.confirm) errs.confirm = "Passwords do not match";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    // Frontend-only — just show success
    setPw({ current: "", next: "", confirm: "" });
    setPwSaved(true);
    addToast("Password updated (demo)", "success");
    setTimeout(() => setPwSaved(false), 2500);
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage profile, organization, notifications and security." />

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t ? "bg-zinc-800 text-white border-zinc-700" : "bg-transparent text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-100">Profile</h2>
          <p className="mt-1 text-xs text-zinc-500">Update your personal information. Persists via localStorage.</p>
          <form onSubmit={handleProfileSave} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-zinc-300">Full Name</label>
              <Input id="fullName" value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
              {profileErrors.fullName && <p className="mt-1 text-xs text-red-400">{profileErrors.fullName}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-email" className="mb-1 block text-xs font-medium text-zinc-300">Email</label>
                <Input id="profile-email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                {profileErrors.email && <p className="mt-1 text-xs text-red-400">{profileErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="profile-phone" className="mb-1 block text-xs font-medium text-zinc-300">Phone</label>
                <Input id="profile-phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                {profileErrors.phone && <p className="mt-1 text-xs text-red-400">{profileErrors.phone}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">Save Profile</Button>
              <Button type="button" variant="secondary" onClick={() => setProfile(getProfile())}>Reset</Button>
              {profileSaved && <span className="text-xs text-emerald-400">Saved ✓</span>}
            </div>
          </form>
        </Card>
      )}

      {activeTab === "Organization" && (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-100">Organization</h2>
          <p className="mt-1 text-xs text-zinc-500">Company details for MoveFlow.</p>
          <form onSubmit={handleOrgSave} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="companyName" className="mb-1 block text-xs font-medium text-zinc-300">Company Name</label>
              <Input id="companyName" value={org.companyName} onChange={(e) => setOrg((p) => ({ ...p, companyName: e.target.value }))} />
              {orgErrors.companyName && <p className="mt-1 text-xs text-red-400">{orgErrors.companyName}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="companyEmail" className="mb-1 block text-xs font-medium text-zinc-300">Company Email</label>
                <Input id="companyEmail" type="email" value={org.companyEmail} onChange={(e) => setOrg((p) => ({ ...p, companyEmail: e.target.value }))} />
                {orgErrors.companyEmail && <p className="mt-1 text-xs text-red-400">{orgErrors.companyEmail}</p>}
              </div>
              <div>
                <label htmlFor="companyPhone" className="mb-1 block text-xs font-medium text-zinc-300">Company Phone</label>
                <Input id="companyPhone" value={org.companyPhone} onChange={(e) => setOrg((p) => ({ ...p, companyPhone: e.target.value }))} />
                {orgErrors.companyPhone && <p className="mt-1 text-xs text-red-400">{orgErrors.companyPhone}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="address" className="mb-1 block text-xs font-medium text-zinc-300">Address</label>
              <Input id="address" value={org.address} onChange={(e) => setOrg((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">Save Organization</Button>
              <Button type="button" variant="secondary" onClick={() => setOrg(getOrganization())}>Reset</Button>
              {orgSaved && <span className="text-xs text-emerald-400">Saved ✓</span>}
            </div>
          </form>
        </Card>
      )}

      {activeTab === "Notifications" && (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-100">Notifications</h2>
          <p className="mt-1 text-xs text-zinc-500">Control how you receive updates. Toggles persist via localStorage.</p>
          <div className="mt-4 divide-y divide-zinc-800">
            {[
              { key: "shipment", label: "Shipment notifications", desc: "New shipments, status changes, deliveries" },
              { key: "payment", label: "Payment notifications", desc: "Payment received, failed, refunded" },
              { key: "system", label: "System notifications", desc: "Maintenance, updates, security alerts" },
              { key: "email", label: "Email notifications", desc: "Digest emails and alerts" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <Toggle enabled={notif[item.key]} onChange={(v) => setNotif((prev) => ({ ...prev, [item.key]: v }))} label={item.label} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={handleNotifSave}>Save Preferences</Button>
            {notifSaved && <span className="text-xs text-emerald-400">Saved ✓</span>}
          </div>
        </Card>
      )}

      {activeTab === "Security" && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Change Password</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Demo only — password changes are not saved. Sign-in uses the API's JWT authentication.
            </p>
            <form onSubmit={handlePasswordSave} noValidate className="mt-4 space-y-4 max-w-md">
              <div>
                <label htmlFor="current" className="mb-1 block text-xs font-medium text-zinc-300">Current Password</label>
                <Input id="current" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
              </div>
              <div>
                <label htmlFor="next" className="mb-1 block text-xs font-medium text-zinc-300">New Password</label>
                <Input id="next" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="••••••••" />
                {pwErrors.next && <p className="mt-1 text-xs text-red-400">{pwErrors.next}</p>}
              </div>
              <div>
                <label htmlFor="confirm" className="mb-1 block text-xs font-medium text-zinc-300">Confirm New Password</label>
                <Input id="confirm" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
                {pwErrors.confirm && <p className="mt-1 text-xs text-red-400">{pwErrors.confirm}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit">Update Password</Button>
                {pwSaved && <span className="text-xs text-emerald-400">Updated ✓ (demo)</span>}
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Active Sessions</h2>
            <p className="mt-1 text-xs text-zinc-500">Simulated session information.</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between border-b border-zinc-800 py-2">
                <span className="text-zinc-400">Current session</span>
                <span className="text-zinc-200">Chrome · Lagos — active now</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">Last login</span>
                <span className="text-zinc-300">28 Sep 2026 · 09:14</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Settings;
