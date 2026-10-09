import { useSyncExternalStore } from "react";
import { subscribeAuth, getAuthSnapshot } from "../services/authService";

/**
 * Reads the auth session store. `getAuthSnapshot` returns a stable object that
 * only changes when the session changes, which is what useSyncExternalStore
 * requires.
 */
export function useAuth() {
  const { status, user } = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);

  return {
    status,
    user,
    isAuthenticated: status === "authenticated",
    isRestoring: status === "restoring",
    isAnonymous: status === "anonymous",
    role: user?.role || null,
  };
}

export default useAuth;