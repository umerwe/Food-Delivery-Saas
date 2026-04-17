"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/constants";

interface User {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  restaurantId?: string | null;
  branchId?: string | null;
  profile?: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
    phone?: string | null;
    bio?: string;
     createdAt?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: any) => void;
  logout: () => void;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------------- STORAGE HELPERS ----------------
  const getStoredAuth = () => {
    const stored = localStorage.getItem("auth");
    if (!stored) return null;
    return JSON.parse(stored);
  };

  const saveAuth = (data: any) => {
    localStorage.setItem("auth", JSON.stringify(data));
  };

  const clearAuthStorage = () => {
    localStorage.removeItem("auth");
  };

  // ---------------- API HELPERS ----------------
 
  const refreshToken = async () => {
  const stored = getStoredAuth();
  if (!stored?.refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: stored.refreshToken,
      }),
    });

    if (!res.ok) return false;

    const data = await res.json();

    const mergedData = {
      ...data.data,
      user: {
        ...stored.user, // ✅ preserve old user data
      },
    };

    saveAuth(mergedData);

    return mergedData.accessToken;
  } catch (err) {
    console.error("Refresh token failed", err);
    return false;
  }
};

const fetchMe = async (token: string) => {
  const res = await fetch(`${API_BASE_URL}/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("FETCH_ME_FAILED");
  }

  const data = await res.json();
  return data.data;
};

  // ---------------- INIT AUTH ----------------
  useEffect(() => {
  const initAuth = async () => {
    try {
      const stored = getStoredAuth();

      if (!stored?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchMe(stored.accessToken);

        const mergedUser = {
          ...me,
          restaurantId: stored?.user?.restaurantId ?? null,
          branchId: stored?.user?.branchId ?? null,
        };

        setUser(mergedUser);
        setToken(stored.accessToken);
      } catch (error: unknown) {
        // ✅ Safely check error type
        const isUnauthorized =
          error instanceof Error && error.message === "UNAUTHORIZED";

        if (!isUnauthorized) {
          console.error("Non-auth error during fetchMe:", error);
          setLoading(false);
          return;
        }

        // 🔄 Try refresh only for 401
        const newAccessToken = await refreshToken();

        if (!newAccessToken) {
          clearAuthStorage();
          setUser(null);
          setToken(null);
          setLoading(false);
          return;
        }

        const me = await fetchMe(newAccessToken);
        const updatedStored = getStoredAuth();

        const mergedUser = {
          ...me,
          restaurantId: updatedStored?.user?.restaurantId ?? null,
          branchId: updatedStored?.user?.branchId ?? null,
        };

        setUser(mergedUser);
        setToken(newAccessToken);
      }
    } catch (error) {
      console.error("Auth init failed", error);
    } finally {
      setLoading(false);
    }
  };

  initAuth();
}, []);
  // ---------------- ACTIONS ----------------
  const login = (data: any) => {
    saveAuth(data);
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setToken(null);
  };

  return (
   <AuthContext.Provider value={{ user, token, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return ctx;
};