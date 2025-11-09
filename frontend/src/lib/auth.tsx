import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { clearAuthTokens, setAuthTokens, setLogoutHandler } from "./api";
import {
  User,
  login as loginRequest,
  logout as logoutRequest,
  getCurrentUser
} from "./apiClient";
import { clearTokensStorage, loadTokens, saveTokens } from "./authStorage";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  passwordChangeRequired: boolean;
};

type AuthContextValue = {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markPasswordChanged: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    isLoading: true,
    passwordChangeRequired: false
  });

  useEffect(() => {
    const persisted = loadTokens();
    if (persisted.accessToken && persisted.refreshToken) {
      setAuthTokens({ accessToken: persisted.accessToken, refreshToken: persisted.refreshToken });
      setState((prev) => ({ ...prev, accessToken: persisted.accessToken, refreshToken: persisted.refreshToken }));
      void getCurrentUser()
        .then((user) => {
          setState((prev) => ({
            ...prev,
            user,
            isLoading: false,
            passwordChangeRequired: user.must_change_password
          }));
        })
        .catch(() => {
          clearAuthTokens();
          clearTokensStorage();
          setState({ accessToken: null, refreshToken: null, user: null, isLoading: false, passwordChangeRequired: false });
        });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    setLogoutHandler(() => {
      clearAuthTokens();
      clearTokensStorage();
      setState({ accessToken: null, refreshToken: null, user: null, isLoading: false, passwordChangeRequired: false });
      window.location.href = "/login";
    });
    return () => {
      setLogoutHandler(null);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await loginRequest({ username, password });
    setAuthTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    saveTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    const profile = await getCurrentUser();
    setState({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: profile,
      isLoading: false,
      passwordChangeRequired: tokens.password_change_required || profile.must_change_password
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error("Failed to logout cleanly", error);
    } finally {
      clearAuthTokens();
      clearTokensStorage();
      setState({ accessToken: null, refreshToken: null, user: null, isLoading: false, passwordChangeRequired: false });
      window.location.href = "/login";
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await getCurrentUser();
    setState((prev) => ({
      ...prev,
      user: profile,
      passwordChangeRequired: profile.must_change_password
    }));
  }, []);

  const markPasswordChanged = useCallback(() => {
    setState((prev) => ({ ...prev, passwordChangeRequired: false }));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    state,
    login,
    logout,
    refreshProfile,
    markPasswordChanged
  }), [state, login, logout, refreshProfile, markPasswordChanged]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
