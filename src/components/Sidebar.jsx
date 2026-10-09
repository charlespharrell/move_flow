import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { rolePermissions } from "../services/userService";

// Navigation config — Phase 3 final groups
const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/", icon: "dashboard" }],
  },
  {
    label: "Operations",
    items: [{ label: "Shipments", path: "/shipments", icon: "shipments" }],
  },
  {
    label: "Network",
    items: [
      { label: "Customers", path: "/customers", icon: "customers" },
      { label: "Drivers & Haulers", path: "/drivers", icon: "drivers" },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Payments", path: "/payments", icon: "payments" }],
  },
  {
    label: "System",
    items: [
      { label: "Users", path: "/users", icon: "users" },
      { label: "Settings", path: "/settings", icon: "settings" },
    ],
  },
];

function Icon({ name }) {
  if (name === "dashboard") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.2" />
        <rect x="14" y="3" width="7" height="7" rx="1.2" />
        <rect x="3" y="14" width="7" height="7" rx="1.2" />
        <rect x="14" y="14" width="7" height="7" rx="1.2" />
      </svg>
    );
  }
  if (name === "customers") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="8" cy="8" r="3" />
        <path d="M3 17c0-2.2 1.8-4 4-4h2a4 4 0 014 4" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M19.5 16a3 3 0 00-3-3h-1" />
      </svg>
    );
  }
  if (name === "drivers") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 17a2 2 0 104 0 2 2 0 00-4 0zM15 17a2 2 0 104 0 2 2 0 00-4 0z" />
        <path d="M5 17H3V9h10l3 3v5h-1" />
        <path d="M13 9v3h3" />
      </svg>
    );
  }
  if (name === "payments") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="1.5" />
        <path d="M3 10h18" />
        <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="7" r="3" />
        <path d="M5 18c0-2.8 2.2-5 5-5h4c2.8 0 5 2.2 5 5" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3 7.5A2.5 2.5 0 015.5 5h9A2.5 2.5 0 0117 7.5v9a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 013 16.5v-9z" />
      <path d="M7 12h6M12 9.5v5" />
      <circle cx="17.5" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Read-only identity of the signed-in user, as reported by the API. The former
 * role switcher let anyone impersonate another account, which real
 * authentication makes impossible.
 */
function CurrentUserCard() {
  const { user } = useAuth();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-100">{user?.name}</p>
        <p className="text-[11px] text-zinc-500">{user?.role}</p>
      </div>
    </div>
  );
}

function FilteredNav({ onItemClick }) {
  const { role } = useAuth();

  const allowed = rolePermissions[role] || [];

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.includes(item.label)),
    }))
    .filter((group) => group.items.length > 0);

  if (filteredGroups.length === 0) {
    return <p className="px-3 text-xs text-zinc-500">No navigation items available for your role.</p>;
  }

  return (
    <div className="space-y-6">
      {filteredGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{group.label}</p>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }`
                }
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 md:flex">
      {/* Brand */}
      <div className="flex h-[64px] items-center gap-3 border-b border-zinc-800 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">M</span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-50">MoveFlow</p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Admin</p>
        </div>
      </div>

      {/* Navigation — role filtered */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <FilteredNav />
      </nav>

      {/* Signed-in user */}
      <div className="border-t border-zinc-800 p-4">
        <CurrentUserCard />
      </div>
    </aside>
  );
}

// Mobile drawer variant — reuses same filtered nav
export function MobileSidebar({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      {/* Drawer */}
      <div className="relative flex h-full w-[280px] flex-col border-r border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex h-[64px] items-center justify-between border-b border-zinc-800 px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">M</span>
            <div>
              <p className="text-sm font-semibold text-zinc-50">MoveFlow</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <FilteredNav onItemClick={onClose} />
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <CurrentUserCard />
        </div>
      </div>
    </div>
  );
}
