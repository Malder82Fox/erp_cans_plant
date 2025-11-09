import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { deletePart, listParts } from "../../lib/apiClient";
import { useAuth } from "../../lib/auth";
import { DataTable } from "../shared/components/DataTable";
const PAGE_SIZE = 20;
export function WarehouseListPage() {
    const queryClient = useQueryClient();
    const { state: { user } } = useAuth();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [lowStock, setLowStock] = useState(false);
    const { data = { items: [], total: 0, page, page_size: PAGE_SIZE }, isLoading } = useQuery({
        queryKey: ["parts", page, search, lowStock],
        queryFn: () => listParts({ page, page_size: PAGE_SIZE, q: search || undefined, low_stock: lowStock }),
        placeholderData: (prev) => prev
    });
    const deleteMutation = useMutation({
        mutationFn: (partId) => deletePart(partId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["parts"] });
        }
    });
    const columns = useMemo(() => [
        { key: "part_code", header: "Code" },
        { key: "name", header: "Name" },
        { key: "qty_on_hand", header: "Qty" },
        { key: "min_stock", header: "Min" },
        { key: "price", header: "Price" },
        {
            key: "actions",
            header: "Actions",
            render: (part) => (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { variant: "secondary", asChild: true, children: _jsx(Link, { to: `/warehouse/${part.id}`, children: "View" }) }), (user?.role === "admin" || user?.role === "root") && (_jsx(Button, { variant: "secondary", asChild: true, children: _jsx(Link, { to: `/warehouse/${part.id}/edit`, children: "Edit" }) })), user?.role === "root" && (_jsx(Button, { variant: "destructive", onClick: () => deleteMutation.mutate(part.id), children: "Delete" }))] }))
        }
    ], [deleteMutation, user?.role]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Warehouse" }), (user?.role === "admin" || user?.role === "root") && (_jsx(Button, { asChild: true, children: _jsx(Link, { to: "/warehouse/new", children: "Create part" }) }))] }), _jsxs("div", { className: "grid gap-4 rounded-md border bg-card p-4 md:grid-cols-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "search", children: "Search" }), _jsx(Input, { id: "search", value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Code or name" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-6", children: [_jsx("input", { id: "lowStock", type: "checkbox", checked: lowStock, onChange: (event) => setLowStock(event.target.checked) }), _jsx(Label, { htmlFor: "lowStock", children: "Low stock only" })] })] }), _jsx(DataTable, { data: data.items, columns: columns, isLoading: isLoading, pagination: {
                    page,
                    pageSize: PAGE_SIZE,
                    total: data.total,
                    onPageChange: setPage
                } })] }));
}
