import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../lib/auth";
import { type UserRole } from "../../lib/apiClient";

interface Props {
  role: UserRole | UserRole[];
  fallback?: ReactNode;
  children?: ReactNode;
}

function hasAccess(currentRole: UserRole | undefined, allowed: UserRole | UserRole[]): boolean {
  if (!currentRole) return false;
  if (Array.isArray(allowed)) {
    return allowed.includes(currentRole);
  }
  return currentRole === allowed;
}

export function RequireRole({ role, fallback = <Navigate to="/" replace />, children }: Props): JSX.Element {
  const {
    state: { user }
  } = useAuth();

  if (!hasAccess(user?.role, role)) {
    if (children) {
      return <>{fallback}</>;
    }
    return <>{fallback}</>;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
