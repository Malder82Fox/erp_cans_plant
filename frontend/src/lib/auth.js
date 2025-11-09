import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearAuthTokens, setAuthTokens, setLogoutHandler } from "./api";
import { login as loginRequest, logout as logoutRequest, getCurrentUser } from "./apiClient";
import { clearTokensStorage, loadTokens, saveTokens } from "./authStorage";
export const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [state, setState] = useState({
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
        }
        else {
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
    const login = useCallback(async (username, password) => {
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
        }
        catch (error) {
            console.error("Failed to logout cleanly", error);
        }
        finally {
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
    const value = useMemo(() => ({
        state,
        login,
        logout,
        refreshProfile,
        markPasswordChanged
    }), [state, login, logout, refreshProfile, markPasswordChanged]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
