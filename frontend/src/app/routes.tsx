import { createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "../features/shared/RequireAuth";
import { RequireRole } from "../features/shared/RequireRole";
import { AppLayout } from "../features/shared/Layout";
import { LoginPage } from "../features/auth/LoginPage";
import { ChangePasswordPage } from "../features/auth/ChangePasswordPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { WarehouseListPage } from "../features/warehouse/WarehouseListPage";
import { WarehouseDetailPage } from "../features/warehouse/WarehouseDetailPage";
import { MaintenancePage } from "../features/maintenance/MaintenancePage";
import { UsersPage } from "../features/users/UsersPage";
import WarehouseCreatePage from "../features/warehouse/WarehouseCreatePage";
import WarehouseEditPage from "../features/warehouse/WarehouseEditPage";
import ToolingPage from "../features/tooling/ToolingPage";

export const appRouter = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/change-password",
    element: (
      <RequireAuth>
        <ChangePasswordPage />
      </RequireAuth>
    )
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "warehouse", element: <WarehouseListPage /> },
      {
        path: "warehouse/new",
        element: (
          <RequireRole role={["admin", "root"]}>
            <WarehouseCreatePage />
          </RequireRole>
        )
      },
      { path: "warehouse/:id", element: <WarehouseDetailPage /> },
      {
        path: "warehouse/:id/edit",
        element: (
          <RequireRole role={["admin", "root"]}>
            <WarehouseEditPage />
          </RequireRole>
        )
      },
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "tooling", element: <ToolingPage /> },
      {
        path: "admin/users",
        element: (
          <RequireRole role="root">
            <UsersPage />
          </RequireRole>
        )
      }
    ]
  }
]);
