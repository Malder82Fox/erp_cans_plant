import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
export function RequireAuth({ redirectTo = "/login", children }) {
    const { state: { accessToken, isLoading, passwordChangeRequired } } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return _jsx("div", { className: "flex h-full items-center justify-center", children: "Loading..." });
    }
    if (!accessToken) {
        return _jsx(Navigate, { to: redirectTo, state: { from: location }, replace: true });
    }
    if (passwordChangeRequired && location.pathname !== "/change-password") {
        return _jsx(Navigate, { to: "/change-password", replace: true });
    }
    if (children) {
        return _jsx(_Fragment, { children: children });
    }
    return _jsx(Outlet, {});
}
