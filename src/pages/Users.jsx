import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/States";
import { getUsers, subscribe } from "../services/userService";
import { formatDate } from "../utils/format";

function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [users, setUsers] = useState(() => getUsers());

  useEffect(() => {
    const unsub = subscribe(() => setUsers([...getUsers()]));
    return unsub;
  }, []);

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

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.id.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q);
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginated = filtered.slice(startIndex, startIndex + perPage);

  const firstResult = filtered.length === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + perPage, filtered.length);
  const hasActiveFilters = searchTerm !== "" || roleFilter !== "All" || statusFilter !== "All";

  function clearFilters() {
    setSearchTerm("");
    setRoleFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  return (
    <div>
      <PageHeader title="Users & Roles" description="Manage internal MoveFlow users and their permissions." />

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
              onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
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
        <p className="text-sm text-zinc-400">
          Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {filtered.length} {filtered.length === 1 ? "user" : "users"}
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-blue-400 hover:text-blue-300">
            Clear filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
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
              {filtered.length > 0 ? (
                paginated.map((u) => (
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

      {filtered.length > 0 && (
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

export default Users;
