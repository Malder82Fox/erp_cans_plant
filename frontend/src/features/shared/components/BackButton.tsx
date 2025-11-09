import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/button";

interface BackButtonProps {
  to?: string;
  label?: string;
}

export function BackButton({ to, label = "Back" }: BackButtonProps): JSX.Element {
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      variant="ghost"
      className="flex items-center gap-2"
      onClick={() => (to ? navigate(to) : navigate(-1))}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
