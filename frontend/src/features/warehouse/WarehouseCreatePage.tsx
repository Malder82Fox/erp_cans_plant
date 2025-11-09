import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { createPart, type PartPayload } from "../../lib/apiClient";
import { PartForm } from "./PartForm";

export function WarehouseCreatePage(): JSX.Element {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (payload: PartPayload) => createPart(payload),
    onSuccess: (part) => {
      navigate(`/warehouse/${part.id}`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Create part</h2>
      </CardHeader>
      <CardContent>
        <PartForm mode="create" onSubmit={(payload) => mutation.mutateAsync(payload as PartPayload)} isSubmitting={mutation.isPending} />
      </CardContent>
    </Card>
  );
}
