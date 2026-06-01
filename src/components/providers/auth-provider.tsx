"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuthSession,
  mergeStoredUserState,
  readAuthSession,
  saveAuthSession,
} from "@/lib/auth";
import { getCurrentUser, refreshCustomerToken } from "@/services/auth";
import type { AuthContextValue, AuthSession, AuthUser } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = useCallback((nextUser: AuthUser | null | ((user: AuthUser | null) => AuthUser | null)) => {
    setUserState((currentUser) => {
      const resolvedUser = typeof nextUser === "function" ? nextUser(currentUser) : nextUser;
      const storedAuth = readAuthSession();

      if (storedAuth && resolvedUser) {
        saveAuthSession({
          ...storedAuth,
          user: resolvedUser,
        });
      }

      return resolvedUser;
    });
  }, []);

  const login = useCallback((data: AuthSession) => {
    saveAuthSession(data);
    setToken(data.accessToken);
    setUserState(data.user);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUserState(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedAuth = readAuthSession();

        if (!storedAuth?.accessToken) {
          setLoading(false);
          return;
        }

        try {
          const me = await getCurrentUser(storedAuth.accessToken);
          setUserState(mergeStoredUserState(me, storedAuth.user));
          setToken(storedAuth.accessToken);
        } catch (error) {
          const isUnauthorized = error instanceof Error && error.message === "Request failed";

          if (!isUnauthorized) {
            setLoading(false);
            return;
          }

          if (!storedAuth.refreshToken) {
            logout();
            setLoading(false);
            return;
          }

          const refreshedToken = await refreshCustomerToken({
            refreshToken: storedAuth.refreshToken,
          });

          const refreshedAuth: AuthSession = {
            ...storedAuth,
            ...refreshedToken,
            user: storedAuth.user,
          };

          saveAuthSession(refreshedAuth);

          const me = await getCurrentUser(refreshedToken.accessToken);
          const latestStoredAuth = readAuthSession();

          setUserState(mergeStoredUserState(me, latestStoredAuth?.user ?? storedAuth.user));
          setToken(refreshedToken.accessToken);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
};
