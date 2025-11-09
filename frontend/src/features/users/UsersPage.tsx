import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { type PaginatedResponse } from "../../lib/api";
import { type User, type UserRole, type UserUpdateRequest, listUsers, updateUser } from "../../lib/apiClient";
import { DataTable, type DataTableColumn } from "../shared/components/DataTable";
import { RoleBadge } from "../shared/components/RoleBadge";
import { CreateUserDialog } from "./CreateUserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

const PAGE_SIZE = 20;

export function UsersPage(): JSX.Element {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const {
    data = { items: [], total: 0, page, page_size: PAGE_SIZE },
    isLoading
  } = useQuery<PaginatedResponse<User>>({
    queryKey: ["users", page, roleFilter, statusFilter, search],
    queryFn: () =>
      listUsers({
        page,
        page_size: PAGE_SIZE,
        role: roleFilter ? (roleFilter as UserRole) : undefined,
        is_active: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
        q: search || undefined
      }),
    placeholderData: (prev) => prev
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UserUpdateRequest }) => updateUser(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
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
        render: (user) => <RoleBadge role={user.role} />
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
        render: (user) => (
          <div className="flex flex-wrap gap-2">
            <Select
              value={user.role}
              onChange={(event) =>
                updateMutation.mutate({ userId: user.id, payload: { role: event.target.value as UserRole } })
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="root">Root</option>
            </Select>
            <Button
              variant="secondary"
              onClick={() => updateMutation.mutate({ userId: user.id, payload: { is_active: !user.is_active } })}
            >
              {user.is_active ? t("users.deactivate") : t("users.activate")}
            </Button>
            <ResetPasswordDialog userId={user.id} onReset={() => void queryClient.invalidateQueries({ queryKey: ["users"] })} />
          </div>
        )
      }
    ],
    [queryClient, t, updateMutation]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("users.title")}</h1>
        <CreateUserDialog onCreated={() => void queryClient.invalidateQueries({ queryKey: ["users"] })} />
      </div>
      <div className="grid gap-4 rounded-md border bg-card p-4 md:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="search">{t("app.search")}</Label>
          <Input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("users.searchPlaceholder") ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">{t("users.roleFilter")}</Label>
          <Select id="role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="root">Root</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">{t("users.statusFilter")}</Label>
          <Select id="status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            <option value="active">{t("users.statusActive")}</option>
            <option value="inactive">{t("users.statusInactive")}</option>
          </Select>
        </div>
      </div>
      <DataTable
        data={data.items}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data.total,
          onPageChange: setPage
        }}
      />
    </div>
  );
}
