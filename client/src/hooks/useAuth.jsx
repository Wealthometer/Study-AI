import { createContext, useContext, useState, useCallback } from "react";
import { useClerk, useSignIn, useAuth as useClerkAuth } from "@clerk/clerk-react";
import api from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_user")); }
    catch { return null; }
  });
  const [loading] = useState(false);
  const { signIn, isLoaded: clerkLoaded } = useSignIn();
  const { signOut: clerkSignOut } = useClerk();
  const { isSignedIn } = useClerkAuth();

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("sf_token", data.token);
    localStorage.setItem("sf_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("sf_token", data.token);
    localStorage.setItem("sf_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const setUserFromToken = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
    setUser(null);
    try { clerkSignOut?.(); } catch {}
  }, [clerkSignOut]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      localStorage.setItem("sf_user", JSON.stringify(data.user));
      setUser(data.user);
    } catch {}
  }, []);

  const loginWithGoogle = useCallback(() => {
    if (!clerkLoaded || !signIn) {
      throw new Error("Auth is still loading. Please try again in a moment.");
    }

    const redirectUrl = `${window.location.origin}/auth/callback`;
    const redirectUrlComplete = `${window.location.origin}/auth/callback`;

    if (isSignedIn) {
      window.location.href = redirectUrl;
      return;
    }

    return signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl,
      redirectUrlComplete,
    });
  }, [clerkLoaded, signIn, isSignedIn]);

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refreshUser, loginWithGoogle, setUserFromToken }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

