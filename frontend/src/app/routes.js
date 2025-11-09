import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(LoginPage, {})
    },
    {
        path: "/change-password",
        element: (_jsx(RequireAuth, { children: _jsx(ChangePasswordPage, {}) }))
    },
    {
        path: "/",
        element: (_jsx(RequireAuth, { children: _jsx(AppLayout, {}) })),
        children: [
            { index: true, element: _jsx(DashboardPage, {}) },
            { path: "warehouse", element: _jsx(WarehouseListPage, {}) },
            {
                path: "warehouse/new",
                element: (_jsx(RequireRole, { role: ["admin", "root"], children: _jsx(WarehouseCreatePage, {}) }))
            },
            { path: "warehouse/:id", element: _jsx(WarehouseDetailPage, {}) },
            {
                path: "warehouse/:id/edit",
                element: (_jsx(RequireRole, { role: ["admin", "root"], children: _jsx(WarehouseEditPage, {}) }))
            },
            { path: "maintenance", element: _jsx(MaintenancePage, {}) },
            { path: "tooling", element: _jsx(ToolingPage, {}) },
            {
                path: "admin/users",
                element: (_jsx(RequireRole, { role: "root", children: _jsx(UsersPage, {}) }))
            }
        ]
    }
]);
