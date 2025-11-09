import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
export function Table({ className, ...props }) {
    return _jsx("table", { className: cn("w-full caption-bottom text-sm", className), ...props });
}
export function TableHeader({ className, ...props }) {
    return _jsx("thead", { className: cn("[&_tr]:border-b", className), ...props });
}
export function TableBody({ className, ...props }) {
    return _jsx("tbody", { className: cn("[&_tr:last-child]:border-0", className), ...props });
}
export function TableRow({ className, ...props }) {
    return _jsx("tr", { className: cn("border-b transition-colors hover:bg-muted/50", className), ...props });
}
export function TableHead({ className, ...props }) {
    return _jsx("th", { className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground", className), ...props });
}
export function TableCell({ className, ...props }) {
    return _jsx("td", { className: cn("p-2 align-middle", className), ...props });
}
export function TableCaption({ className, ...props }) {
    return _jsx("caption", { className: cn("mt-4 text-sm text-muted-foreground", className), ...props });
}
