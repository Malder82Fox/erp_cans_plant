import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../lib/auth";

interface Props {
  redirectTo?: string;
  children?: ReactNode;
}

export function RequireAuth({ redirectTo = "/login", children }: Props): JSX.Element {
  const {
    state: { accessToken, isLoading, passwordChangeRequired }
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  if (!accessToken) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (passwordChangeRequired && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (children) {
    return <>{children}</>;
  }
  return <Outlet />;
}
