import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { login } from "../services/authService";
import { useToast } from "../components/ui/Toast";

const DEMO_ACCOUNTS = [
  { email: "admin@moveflow.local", role: "Administrator" },
  { email: "operations@moveflow.local", role: "Operations" },
  { email: "finance@moveflow.local", role: "Finance" },
];
const DEMO_PASSWORD = "MoveFlow#2026";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@moveflow.local");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email, password, remember);
      addToast(`Welcome back, ${user.name}`, "success");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">M</div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-zinc-50">Sign in to MoveFlow</h1>
          <p className="mt-1 text-sm text-zinc-400">Logistics control centre</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-zinc-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@moveflow.local"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-zinc-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>
              <Link to="/login" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-zinc-500 hover:text-zinc-300">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-center text-xs text-zinc-500">
              Demo: sign in with <span className="font-mono text-zinc-300">{DEMO_PASSWORD}</span>
            </p>
          </form>
        </Card>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Demo accounts</p>
          <div className="mt-2 grid gap-1.5 text-xs">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.email} className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                  className="font-mono text-zinc-400 hover:text-zinc-200"
                >
                  {account.email}
                </button>
                <span className="text-zinc-500">{account.role}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">All demo passwords are {DEMO_PASSWORD}.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
