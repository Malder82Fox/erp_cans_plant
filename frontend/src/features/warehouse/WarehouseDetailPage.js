import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { listAuditLogs, getPart } from "../../lib/apiClient";
import { BackButton } from "../shared/components/BackButton";
export function WarehouseDetailPage() {
    const params = useParams();
    const partId = Number(params.id);
    const partQuery = useQuery({ queryKey: ["part", partId], queryFn: () => getPart(partId), enabled: Number.isFinite(partId) });
    const auditQuery = useQuery({
        queryKey: ["part", partId, "audit"],
        queryFn: () => listAuditLogs(partId),
        enabled: Number.isFinite(partId)
    });
    if (partQuery.isLoading) {
        return _jsx("div", { children: "Loading..." });
    }
    if (!partQuery.data) {
        return _jsx("div", { children: "Part not found" });
    }
    const part = partQuery.data;
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(BackButton, { label: "Back to list", to: "/warehouse" }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("h2", { className: "text-xl font-semibold", children: part.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Code: ", part.part_code] })] }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("div", { children: ["Quantity: ", part.qty_on_hand] }), _jsxs("div", { children: ["Min stock: ", part.min_stock] }), _jsxs("div", { children: ["Price: ", part.price, " ", part.currency] }), _jsxs("div", { children: ["Status: ", part.is_deleted ? "Deleted" : "Active"] }), _jsxs("div", { children: ["Description: ", part.description ?? "—"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: "Audit log" }) }), _jsx(CardContent, { className: "space-y-2", children: auditQuery.isLoading ? (_jsx("div", { children: "Loading..." })) : auditQuery.data && auditQuery.data.length > 0 ? (auditQuery.data.map((log) => (_jsxs("div", { className: "rounded-md border p-2", children: [_jsx("div", { className: "text-sm font-medium", children: log.action }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["User: ", log.user_id ?? "system"] }), log.changes && _jsx("pre", { className: "mt-2 whitespace-pre-wrap text-xs", children: log.changes })] }, log.id)))) : (_jsx("div", { className: "text-sm text-muted-foreground", children: "No audit records." })) })] })] }));
}
