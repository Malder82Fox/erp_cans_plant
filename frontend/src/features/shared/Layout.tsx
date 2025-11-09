import { LayoutDashboard, Package, Settings2, Shield, Wrench } from "lucide-react";
import { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  roles: string[];
  section?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["user", "admin", "root"] },
  { label: "Warehouse", to: "/warehouse", icon: <Package className="h-4 w-4" />, roles: ["user", "admin", "root"] },
  { label: "Maintenance", to: "/maintenance", icon: <Wrench className="h-4 w-4" />, roles: ["user", "admin", "root"] },
  { label: "Tooling", to: "/tooling", icon: <Settings2 className="h-4 w-4" />, roles: ["user", "admin", "root"] },
  { label: "Users", to: "/admin/users", icon: <Shield className="h-4 w-4" />, roles: ["root"], section: "Admin" }
];

export function AppLayout(): JSX.Element {
  const {
    state: { user }
  } = useAuth();

  const allowedNav = navItems.filter((item) => (user ? item.roles.includes(user.role) : false));

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-background p-4 lg:flex">
        <div className="mb-6 text-xl font-semibold">ERP</div>
        <nav className="flex-1 space-y-2">
          {allowedNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
                  isActive && "bg-secondary text-foreground"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 text-sm text-muted-foreground">
          <div>{user?.username}</div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3 lg:hidden">
          <div className="text-lg font-semibold">ERP</div>
          <LogoutButton />
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
