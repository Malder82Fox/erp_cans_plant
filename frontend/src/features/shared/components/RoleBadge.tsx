import { Badge } from "../../../components/ui/badge";
import { type UserRole } from "../../../lib/apiClient";

const roleLabels: Record<UserRole, string> = {
  root: "Root",
  admin: "Admin",
  user: "User"
};

export function RoleBadge({ role }: { role: UserRole }): JSX.Element {
  const variant = role === "root" ? "destructive" : role === "admin" ? "secondary" : "outline";
  return <Badge variant={variant}>{roleLabels[role]}</Badge>;
}
