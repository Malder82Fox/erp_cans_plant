import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
const variantClass = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    destructive: "bg-destructive text-destructive-foreground"
};
export function Badge({ className, variant = "default", ...props }) {
    return (_jsx("span", { className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variantClass[variant], className), ...props }));
}
