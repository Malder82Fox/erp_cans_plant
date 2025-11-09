import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { listUsers, updateUser } from "../../lib/apiClient";
import { DataTable } from "../shared/components/DataTable";
import { RoleBadge } from "../shared/components/RoleBadge";
import { CreateUserDialog } from "./CreateUserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
const PAGE_SIZE = 20;
export function UsersPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const { data = { items: [], total: 0, page, page_size: PAGE_SIZE }, isLoading } = useQuery({
        queryKey: ["users", page, roleFilter, statusFilter, search],
        queryFn: () => listUsers({
            page,
            page_size: PAGE_SIZE,
            role: roleFilter ? roleFilter : undefined,
            is_active: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
            q: search || undefined
        }),
        placeholderData: (prev) => prev
    });
    const updateMutation = useMutation({
        mutationFn: ({ userId, payload }) => updateUser(userId, payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["users"] });
        }
    });
    const columns = useMemo(() => [
        {
            key: "username",
            header: t("auth.username")
        },
        {
            key: "email",
            header: t("users.email"),
            accessor: (user) => user.email ?? "—"
        },
        {
            key: "role",
            header: t("users.role"),
            render: (user) => _jsx(RoleBadge, { role: user.role })
        },
        {
            key: "is_active",
            header: t("app.status"),
            accessor: (user) => (user.is_active ? t("users.statusActive") : t("users.statusInactive"))
        },
        {
            key: "must_change_password",
            header: t("auth.mustChange"),
            accessor: (user) => (user.must_change_password ? t("app.yes") : t("app.no"))
        },
        {
            key: "actions",
            header: t("app.actions"),
            render: (user) => (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Select, { value: user.role, onChange: (event) => updateMutation.mutate({ userId: user.id, payload: { role: event.target.value } }), children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "root", children: "Root" })] }), _jsx(Button, { variant: "secondary", onClick: () => updateMutation.mutate({ userId: user.id, payload: { is_active: !user.is_active } }), children: user.is_active ? t("users.deactivate") : t("users.activate") }), _jsx(ResetPasswordDialog, { userId: user.id, onReset: () => void queryClient.invalidateQueries({ queryKey: ["users"] }) })] }))
        }
    ], [queryClient, t, updateMutation]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: t("users.title") }), _jsx(CreateUserDialog, { onCreated: () => void queryClient.invalidateQueries({ queryKey: ["users"] }) })] }), _jsxs("div", { className: "grid gap-4 rounded-md border bg-card p-4 md:grid-cols-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "search", children: t("app.search") }), _jsx(Input, { id: "search", value: search, onChange: (event) => setSearch(event.target.value), placeholder: t("users.searchPlaceholder") ?? "" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "role", children: t("users.roleFilter") }), _jsxs(Select, { id: "role", value: roleFilter, onChange: (event) => setRoleFilter(event.target.value), children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "root", children: "Root" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "status", children: t("users.statusFilter") }), _jsxs(Select, { id: "status", value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "active", children: t("users.statusActive") }), _jsx("option", { value: "inactive", children: t("users.statusInactive") })] })] })] }), _jsx(DataTable, { data: data.items, columns: columns, isLoading: isLoading, pagination: {
                    page,
                    pageSize: PAGE_SIZE,
                    total: data.total,
                    onPageChange: setPage
                } })] }));
}
