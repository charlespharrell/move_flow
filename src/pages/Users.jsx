import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import UserForm from "../components/UserForm";
import { listUsers, createUser } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/format";
import { describeApiError } from "../utils/apiError";
import { useToast } from "../components/ui/Toast";

const PER_PAGE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function Users() {
  const { role } = useAuth();
  const canManage = role === "Administrator";
  const { addToast } = useToast();

  // Filter state — search is debounced before it reaches the API
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Last completed request. `key` is the query it answered, so a changed query
  // reads as "loading" without any setState inside the fetch effect.
  const queryKey = `${currentPage}|${debouncedSearch}|${roleFilter}|${statusFilter}|${reloadKey}`;
  const [completed, setCompleted] = useState({ key: null, data: null, error: null });

  // Create modal
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listUsers({
      page: currentPage,
      limit: PER_PAGE,
      search: debouncedSearch,
      role: roleFilter === "All" ? undefined : roleFilter,
      status: statusFilter === "All" ? undefined : statusFilter,
    })
      .then((data) => {
        if (!cancelled) setCompleted({ key: queryKey, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) setCompleted({ key: queryKey, data: null, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, currentPage, debouncedSearch, roleFilter, statusFilter, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loading = completed.key !== queryKey;
  const error = loading ? null : completed.error;
  const data = completed.data;

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }
  function handleRoleChange(e) {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  }
  function handleStatusChange(e) {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }

  async function handleCreate(formData) {
    setCreating(true);
    try {
      const created = await createUser(formData);
      setAddOpen(false);
      setSearchTerm("");
      setDebouncedSearch("");
      setRoleFilter("All");
      setStatusFilter("All");
      setCurrentPage(1);
      setReloadKey((k) => k + 1);
      addToast(`User ${created?.name ?? formData.name} created`, "success");
    } catch (err) {
      addToast(describeApiError(err, { forbidden: "You do not have permission to create users." }), "error");
    } finally {
      setCreating(false);
    }
  }

  const users = data?.users ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const startIndex = (currentPage - 1) * PER_PAGE;

  const firstResult = total === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + PER_PAGE, total);
  const hasActiveFilters = searchTerm !== "" || roleFilter !== "All" || statusFilter !== "All";

  function clearFilters() {
    setSearchTerm("");
    setDebouncedSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Manage internal MoveFlow users and their permissions."
        action={canManage ? <Button onClick={() => setAddOpen(true)}>Add User</Button> : undefined}
      />

      {canManage && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User">
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setAddOpen(false)}
            submitting={creating}
            submitLabel="Create User"
          />
        </Modal>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 lg:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name, email, phone…"
            className="flex-1"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={roleFilter} onChange={handleRoleChange} className="w-full sm:w-40">
            <option value="All">All roles</option>
            <option value="Administrator">Administrator</option>
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
          </Select>
          <Select value={statusFilter} onChange={handleStatusChange} className="w-full sm:w-32">
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" aria-hidden="true" />
          )}
          <span>
            Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {total}{" "}
            {total === 1 ? "user" : "users"}
          </span>
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-blue-400 hover:text-blue-300">
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <ErrorState
            title="Unable to load users"
            description={describeApiError(error, { forbidden: "You do not have permission to view users.", fallback: "Unable to load users." })}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        </div>
      ) : !data ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <LoadingState label="Loading users…" />
        </div>
      ) : (
        <div className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">User</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Email</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Role</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Last Active</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Joined</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-100">{u.name}</div>
                        <div className="text-xs font-mono text-zinc-500">{u.id}</div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                      <td className="px-5 py-3.5 text-zinc-400">{formatDate(u.lastActive)}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{formatDate(u.joinedDate)}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/users/${u.id}`} className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        title="No users found"
                        description={hasActiveFilters ? "Try adjusting your search or filters." : "No users available."}
                        actionLabel={hasActiveFilters ? "Clear filters" : undefined}
                        onAction={hasActiveFilters ? clearFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!error && total > 0 && (
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

export default Users;
