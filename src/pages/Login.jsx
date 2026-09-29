import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { login } from "../services/authService";
import { useToast } from "../components/ui/Toast";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("ada@moveflow.ng");
  const [password, setPassword] = useState("password");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const from = location.state?.from?.pathname || "/";

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    const result = login(email, password, remember);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    addToast(`Welcome back, ${result.user.name}`, "success");
    navigate(from, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">M</div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-zinc-50">Sign in to MoveFlow</h1>
          <p className="mt-1 text-sm text-zinc-400">Logistics control centre — demo authentication</p>
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
                placeholder="ada@moveflow.ng"
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
              Demo: use any account with password <span className="font-mono text-zinc-300">password</span>
            </p>
          </form>
        </Card>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Demo accounts</p>
          <div className="mt-2 grid gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="font-mono text-zinc-400">ada@moveflow.ng</span>
              <span className="text-zinc-500">Administrator</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-zinc-400">chinedu@moveflow.ng</span>
              <span className="text-zinc-500">Operations</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-zinc-400">funmilayo@moveflow.ng</span>
              <span className="text-zinc-500">Finance</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500">All demo passwords are `password`.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
