import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
export function BackButton({ to, label = "Back" }) {
    const navigate = useNavigate();
    return (_jsxs(Button, { type: "button", variant: "ghost", className: "flex items-center gap-2", onClick: () => (to ? navigate(to) : navigate(-1)), children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), label] }));
}
