import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import * as api from "../../lib/apiClient";
import { BackButton } from "../shared/components/BackButton";
import { PartForm } from "./PartForm";
import type { PartUpdate } from "../../lib/apiClient";

export default function WarehouseEditPage(): JSX.Element {
  const { id } = useParams();

  const partQuery = useQuery({
    queryKey: ["warehouse", "part", id],
    queryFn: () => api.getPart(Number(id)),
    enabled: !!id
  });

  const mutation = useMutation({
    mutationFn: (payload: PartUpdate) => api.updatePart(Number(id), payload),
    onSuccess: () => {
      console.log("Part updated");
    }
  });

  return (
    <Card>
      <CardHeader>
        <BackButton />
        <h3 className="text-lg font-semibold">Edit Part</h3>
      </CardHeader>
      <CardContent>
        <PartForm
          initial={partQuery.data}
          mode="edit"
          onSubmit={async (payload) => {
            await mutation.mutateAsync(payload as PartUpdate); // Promise<void>
          }}
          isSubmitting={mutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
