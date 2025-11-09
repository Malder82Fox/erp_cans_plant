import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LayoutDashboard, Package, Settings2, Shield, Wrench } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/utils";
const navItems = [
    { label: "Dashboard", to: "/", icon: _jsx(LayoutDashboard, { className: "h-4 w-4" }), roles: ["user", "admin", "root"] },
    { label: "Warehouse", to: "/warehouse", icon: _jsx(Package, { className: "h-4 w-4" }), roles: ["user", "admin", "root"] },
    { label: "Maintenance", to: "/maintenance", icon: _jsx(Wrench, { className: "h-4 w-4" }), roles: ["user", "admin", "root"] },
    { label: "Tooling", to: "/tooling", icon: _jsx(Settings2, { className: "h-4 w-4" }), roles: ["user", "admin", "root"] },
    { label: "Users", to: "/admin/users", icon: _jsx(Shield, { className: "h-4 w-4" }), roles: ["root"], section: "Admin" }
];
export function AppLayout() {
    const { state: { user } } = useAuth();
    const allowedNav = navItems.filter((item) => (user ? item.roles.includes(user.role) : false));
    return (_jsxs("div", { className: "flex min-h-screen bg-muted/30", children: [_jsxs("aside", { className: "hidden w-64 flex-col border-r bg-background p-4 lg:flex", children: [_jsx("div", { className: "mb-6 text-xl font-semibold", children: "ERP" }), _jsx("nav", { className: "flex-1 space-y-2", children: allowedNav.map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground", isActive && "bg-secondary text-foreground"), children: [item.icon, item.label] }, item.to))) }), _jsxs("div", { className: "mt-auto space-y-2 text-sm text-muted-foreground", children: [_jsx("div", { children: user?.username }), _jsx(LogoutButton, {})] })] }), _jsxs("div", { className: "flex flex-1 flex-col", children: [_jsxs("header", { className: "flex items-center justify-between border-b bg-background px-4 py-3 lg:hidden", children: [_jsx("div", { className: "text-lg font-semibold", children: "ERP" }), _jsx(LogoutButton, {})] }), _jsx("main", { className: "flex-1 p-4 lg:p-8", children: _jsx(Outlet, {}) })] })] }));
}
