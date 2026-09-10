import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { User } from "@/types";
import { registerRequest, loginRequest, getMeRequest, logoutRequest, RegisterInput } from "@/services/auth";
import { connectSocket, disconnectSocket } from "@/services/socket";
import { getErrorMessage } from "@/services/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: "patient" | "doctor" | "admin") => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistSession = (token: string, user: User) => {
  localStorage.setItem("token", token);
  localStorage.setItem("userType", user.role);
  localStorage.setItem("user", JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userType");
  localStorage.removeItem("user");
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first mount, if a token is already stored (returning visitor / page
  // refresh), verify it against the backend and restore the session.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const freshUser = await getMeRequest();
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        connectSocket(token);
      } catch {
        // Token invalid/expired - the axios interceptor already cleared storage
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string, role?: "patient" | "doctor" | "admin") => {
    const { token, user: loggedInUser } = await loginRequest(email, password, role);
    persistSession(token, loggedInUser);
    connectSocket(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { token, user: newUser } = await registerRequest(input);
    persistSession(token, newUser);
    connectSocket(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Best-effort - still clear local session even if the request fails
      // (e.g. the network is down or the token already expired).
      console.warn("Logout request failed:", getErrorMessage(error));
    }
    clearSession();
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const freshUser = await getMeRequest();
    setUser(freshUser);
    localStorage.setItem("user", JSON.stringify(freshUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
