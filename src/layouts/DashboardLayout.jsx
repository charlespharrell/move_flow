import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar, { MobileSidebar } from "../components/Sidebar";
import { getCurrentUser, subscribe as subscribeAuth, logout } from "../services/authService";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = subscribeAuth(() => setCurrentUser(getCurrentUser()));
    return unsub;
  }, []);

  const initials = currentUser?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "AD";

  function handleLogout() {
    logout();
    addToast("Signed out", "info");
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — mobile nav + contextual */}
        <header className="sticky top-0 z-10 flex h-[64px] items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="mobile-sidebar"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <span className="hidden text-sm font-medium text-zinc-400 md:inline">Operations · Logistics control centre</span>
            <span className="text-sm font-semibold text-zinc-100 md:hidden">MoveFlow</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden h-7 items-center rounded-full border border-zinc-700 bg-zinc-800 px-3 text-xs font-medium text-zinc-300 sm:inline-flex">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              System live
            </span>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-zinc-200">{currentUser?.name}</span>
              <span className="text-[11px] text-zinc-500">{currentUser?.role}</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300" aria-hidden="true">
              {initials}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
              Log out
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
