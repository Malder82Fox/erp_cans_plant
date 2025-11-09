import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from "date-fns";
import { useMemo } from "react";
import { Input } from "../../../components/ui/input";
export function DateRangePicker({ value, onChange }) {
    const formatted = useMemo(() => {
        const from = value.from ? format(new Date(value.from), "yyyy-MM-dd") : "";
        const to = value.to ? format(new Date(value.to), "yyyy-MM-dd") : "";
        return { from, to };
    }, [value]);
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "date", value: formatted.from, onChange: (event) => onChange({ ...value, from: event.target.value || null }) }), _jsx("span", { className: "text-sm text-muted-foreground", children: "\u2013" }), _jsx(Input, { type: "date", value: formatted.to, onChange: (event) => onChange({ ...value, to: event.target.value || null }) })] }));
}
