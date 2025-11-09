import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { getPart, type PartUpdate, updatePart } from "../../lib/apiClient";
import { PartForm } from "./PartForm";

export function WarehouseEditPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const partId = Number(params.id);

  const partQuery = useQuery({ queryKey: ["part", partId], queryFn: () => getPart(partId), enabled: Number.isFinite(partId) });
  const mutation = useMutation({
    mutationFn: (payload: PartUpdate) => updatePart(partId, payload),
    onSuccess: () => {
      void partQuery.refetch();
    }
  });

  if (partQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (!partQuery.data) {
    return <div>Part not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Edit part</h2>
      </CardHeader>
      <CardContent>
        <PartForm
          initial={partQuery.data}
          mode="edit"
          onSubmit={(payload) => mutation.mutateAsync(payload as PartUpdate)}
          isSubmitting={mutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
