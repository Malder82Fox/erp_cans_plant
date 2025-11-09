import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { listAuditLogs, getPart } from "../../lib/apiClient";
import { BackButton } from "../shared/components/BackButton";

export function WarehouseDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const partId = Number(params.id);

  const partQuery = useQuery({ queryKey: ["part", partId], queryFn: () => getPart(partId), enabled: Number.isFinite(partId) });
  const auditQuery = useQuery({
    queryKey: ["part", partId, "audit"],
    queryFn: () => listAuditLogs(partId),
    enabled: Number.isFinite(partId)
  });

  if (partQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (!partQuery.data) {
    return <div>Part not found</div>;
  }

  const part = partQuery.data;

  return (
    <div className="space-y-4">
      <BackButton label="Back to list" to="/warehouse" />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{part.name}</h2>
          <p className="text-sm text-muted-foreground">Code: {part.part_code}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>Quantity: {part.qty_on_hand}</div>
          <div>Min stock: {part.min_stock}</div>
          <div>Price: {part.price} {part.currency}</div>
          <div>Status: {part.is_deleted ? "Deleted" : "Active"}</div>
          <div>Description: {part.description ?? "—"}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Audit log</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditQuery.isLoading ? (
            <div>Loading...</div>
          ) : auditQuery.data && auditQuery.data.length > 0 ? (
            auditQuery.data.map((log) => (
              <div key={log.id} className="rounded-md border p-2">
                <div className="text-sm font-medium">{log.action}</div>
                <div className="text-xs text-muted-foreground">User: {log.user_id ?? "system"}</div>
                {log.changes && <pre className="mt-2 whitespace-pre-wrap text-xs">{log.changes}</pre>}
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No audit records.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
