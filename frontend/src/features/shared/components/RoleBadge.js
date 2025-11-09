import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from "../../../components/ui/badge";
const roleLabels = {
    root: "Root",
    admin: "Admin",
    user: "User"
};
export function RoleBadge({ role }) {
    const variant = role === "root" ? "destructive" : role === "admin" ? "secondary" : "outline";
    return _jsx(Badge, { variant: variant, children: roleLabels[role] });
}
