import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LogOut } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../lib/auth";
export function LogoutButton() {
    const { logout } = useAuth();
    return (_jsxs(Button, { variant: "ghost", className: "flex items-center gap-2", onClick: () => void logout(), children: [_jsx(LogOut, { className: "h-4 w-4" }), "Logout"] }));
}
