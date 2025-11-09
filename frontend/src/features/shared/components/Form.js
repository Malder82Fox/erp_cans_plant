import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../../../components/ui/button";
export function Form({ form, onSubmit, children, submitLabel = "Save", }) {
    return (_jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [children, _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", children: submitLabel }) })] }));
}
function normalizeError(err) {
    const raw = Array.isArray(err) ? err[0] : err;
    // react-hook-form: FieldError { message?: string }
    return raw?.message ?? "";
}
export function FormField({ label, description, error, required = false, children, }) {
    const msg = normalizeError(error);
    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm font-medium", children: [label, required && _jsx("span", { className: "text-destructive", children: "*" })] }), description && (_jsx("div", { className: "text-xs text-muted-foreground", children: description }))] }), children, msg && _jsx("p", { className: "text-xs text-destructive", children: msg })] }));
}
