import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth";
function hasAccess(currentRole, allowed) {
    if (!currentRole)
        return false;
    if (Array.isArray(allowed)) {
        return allowed.includes(currentRole);
    }
    return currentRole === allowed;
}
export function RequireRole({ role, fallback = _jsx(Navigate, { to: "/", replace: true }), children }) {
    const { state: { user } } = useAuth();
    if (!hasAccess(user?.role, role)) {
        if (children) {
            return _jsx(_Fragment, { children: fallback });
        }
        return _jsx(_Fragment, { children: fallback });
    }
    if (children) {
        return _jsx(_Fragment, { children: children });
    }
    return _jsx(Outlet, {});
}
