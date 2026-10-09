import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Unauthorized() {
  return (
    <div>
      <PageHeader title="Unauthorized" description="You don't have permission to access this section." />
      <Card>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-900/40 bg-amber-950/30 text-amber-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h2 className="mt-4 text-sm font-semibold text-zinc-100">Access restricted</h2>
          <p className="mt-1 max-w-md text-sm text-zinc-400">
            Your current role does not have permission to view this page. Contact an administrator if you believe this is an error.
          </p>
          <p className="mt-2 text-xs text-zinc-500">Access is enforced by role-based permissions on both the frontend and the API.</p>
          <div className="mt-6 flex gap-2">
            <Link to="/">
              <Button>Back to Dashboard</Button>
            </Link>
            <Link to="/settings">
              <Button variant="secondary">Go to Settings</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
