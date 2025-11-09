import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { type PaginatedResponse } from "../../lib/api";
import { type Part, deletePart, listParts } from "../../lib/apiClient";
import { useAuth } from "../../lib/auth";
import { DataTable, type DataTableColumn } from "../shared/components/DataTable";

const PAGE_SIZE = 20;

export function WarehouseListPage(): JSX.Element {
  const queryClient = useQueryClient();
  const {
    state: { user }
  } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const { data = { items: [], total: 0, page, page_size: PAGE_SIZE }, isLoading } = useQuery<PaginatedResponse<Part>>({
    queryKey: ["parts", page, search, lowStock],
    queryFn: () => listParts({ page, page_size: PAGE_SIZE, q: search || undefined, low_stock: lowStock }),
    placeholderData: (prev) => prev
  });

  const deleteMutation = useMutation({
    mutationFn: (partId: number) => deletePart(partId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
    }
  });

  const columns = useMemo<DataTableColumn<Part>[]>(
    () => [
      { key: "part_code", header: "Code" },
      { key: "name", header: "Name" },
      { key: "qty_on_hand", header: "Qty" },
      { key: "min_stock", header: "Min" },
      { key: "price", header: "Price" },
      {
        key: "actions",
        header: "Actions",
        render: (part) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to={`/warehouse/${part.id}`}>View</Link>
            </Button>
            {(user?.role === "admin" || user?.role === "root") && (
              <Button variant="secondary" asChild>
                <Link to={`/warehouse/${part.id}/edit`}>Edit</Link>
              </Button>
            )}
            {user?.role === "root" && (
              <Button variant="destructive" onClick={() => deleteMutation.mutate(part.id)}>
                Delete
              </Button>
            )}
          </div>
        )
      }
    ],
    [deleteMutation, user?.role]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Warehouse</h1>
        {(user?.role === "admin" || user?.role === "root") && (
          <Button asChild>
            <Link to="/warehouse/new">Create part</Link>
          </Button>
        )}
      </div>
      <div className="grid gap-4 rounded-md border bg-card p-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="search">Search</Label>
          <Input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code or name" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="lowStock" type="checkbox" checked={lowStock} onChange={(event) => setLowStock(event.target.checked)} />
          <Label htmlFor="lowStock">Low stock only</Label>
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
