import { LogOut } from "lucide-react";

import { Button } from "../../components/ui/button";
import { useAuth } from "../../lib/auth";

export function LogoutButton(): JSX.Element {
  const { logout } = useAuth();
  return (
    <Button variant="ghost" className="flex items-center gap-2" onClick={() => void logout()}>
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
