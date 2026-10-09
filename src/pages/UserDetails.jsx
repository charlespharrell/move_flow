import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DetailRow from "../components/DetailRow";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { ErrorState, LoadingState } from "../components/ui/States";
import { getUser, updateUser, rolePermissions } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/format";
import { describeApiError } from "../utils/apiError";
import { useToast } from "../components/ui/Toast";

const FORBIDDEN = "You do not have permission to manage users.";

function UserDetails() {
  const { userId } = useParams();
  const { role } = useAuth();
  const canManage = role === "Administrator";
  const { addToast } = useToast();

  const [reloadKey, setReloadKey] = useState(0);

  // Last completed fetch, keyed by the request it answered — a changed key
  // reads as "loading" without any setState inside the fetch effect.
  const queryKey = `${userId}|${reloadKey}`;
  const [completed, setCompleted] = useState({ key: null, user: null, error: null });

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getUser(userId)
      .then((record) => {
        if (cancelled) return;
        setCompleted({ key: queryKey, user: record, error: record ? null : { status: 404 } });
      })
      .catch((err) => {
        if (cancelled) return;
        setCompleted({ key: queryKey, user: null, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, userId, reloadKey]);

  const loading = completed.key !== queryKey;
  const error = loading ? null : completed.error;
  const user = completed.user;

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  function startEdit() {
    setForm({ role: user.role, status: user.status });
    setEditMode(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateUser(userId, { role: form.role, status: form.status });
      setCompleted((prev) => ({ ...prev, user: updated ?? prev.user }));
      setEditMode(false);
      setForm(null);
      addToast(`User ${updated?.name ?? userId} updated to ${form.role}`, "success");
    } catch (err) {
      addToast(describeApiError(err, { forbidden: FORBIDDEN }), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Link to="/users" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Users
        </Link>
        <LoadingState label="Loading user…" />
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div>
        <Link to="/users" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Users
        </Link>
        <PageHeader title="User Not Found" description="The user you are looking for does not exist." />
        <Card>
          <p className="text-sm text-zinc-400">
            No user found with ID: <span className="font-mono font-medium text-zinc-100">{userId}</span>
          </p>
          <div className="mt-4">
            <Link to="/users"><Button variant="secondary">Back to Users</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div>
        <Link to="/users" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Users
        </Link>
        <ErrorState title="Unable to load user" description={describeApiError(error, { forbidden: FORBIDDEN, fallback: "Unable to load this user." })} onRetry={reload} />
      </div>
    );
  }

  const permissions = rolePermissions[user.role] || [];

  return (
    <div>
      <Link to="/users" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
        ← Back to Users
      </Link>

      <PageHeader
        title={user.name}
        description={`${user.id} · ${user.email}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={user.status} />
            <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
              {user.role}
            </span>
            {canManage && !editMode && (
              <Button variant="secondary" size="md" onClick={startEdit}>
                Edit User
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">User Information</h2>
            <div className="mt-3">
              <DetailRow label="Name">{user.name}</DetailRow>
              <DetailRow label="Email">{user.email}</DetailRow>
              <DetailRow label="Phone">{user.phone || "—"}</DetailRow>
              <DetailRow label="Role">
                <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                  {user.role}
                </span>
              </DetailRow>
              <DetailRow label="Status"><StatusBadge status={user.status} /></DetailRow>
              <DetailRow label="Joined">{formatDate(user.joinedDate)}</DetailRow>
              <DetailRow label="Last active">{formatDate(user.lastActive)}</DetailRow>
            </div>
          </Card>

          {/* Edit panel */}
          {editMode && form ? (
            <Card>
              <h2 className="text-sm font-semibold text-zinc-100">Edit User</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Changes are saved to the MoveFlow API and apply to this account immediately.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-role" className="mb-1 block text-xs font-medium text-zinc-300">
                    Role
                  </label>
                  <Select id="edit-role" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full" disabled={saving}>
                    <option value="Administrator">Administrator</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="edit-status" className="mb-1 block text-xs font-medium text-zinc-300">
                    Status
                  </label>
                  <Select id="edit-status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full" disabled={saving}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              {/* Permission preview for selected role */}
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs font-medium text-zinc-400">Permissions for {form.role}:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(rolePermissions[form.role] || []).map((perm) => (
                    <span key={perm} className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300 border border-zinc-700">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setEditMode(false); setForm(null); }} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Permissions</h2>
            <p className="mt-1 text-xs text-zinc-500">Navigation preview — the API enforces authorization on every request.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {permissions.map((perm) => (
                <span key={perm} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 border border-zinc-700">
                  {perm}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Role summary</h2>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Administrator</span>
                <span className="text-zinc-300">7 modules</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Operations</span>
                <span className="text-zinc-300">5 modules</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Finance</span>
                <span className="text-zinc-300">3 modules</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Quick info</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {canManage
                ? "Role and status changes are stored server-side and apply to this account's access immediately, including deactivation."
                : "Only administrators can change a user's role or status."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserDetails;
