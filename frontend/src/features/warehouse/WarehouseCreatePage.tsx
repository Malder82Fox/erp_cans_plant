import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import * as api from "../../lib/apiClient";
import { BackButton } from "../shared/components/BackButton";
import { PartForm } from "./PartForm";
import type { PartPayload } from "../../lib/apiClient";

export default function WarehouseCreatePage(): JSX.Element {
  const mutation = useMutation({
    mutationFn: (payload: PartPayload) => api.createPart(payload),
    onSuccess: () => {
      console.log("Part created");
    }
  });

  return (
    <Card>
      <CardHeader>
        <BackButton />
        <h3 className="text-lg font-semibold">Create Part</h3>
      </CardHeader>
      <CardContent>
        <PartForm
          mode="create"
          onSubmit={async (payload) => {
            await mutation.mutateAsync(payload as PartPayload); // Promise<void>
          }}
          isSubmitting={mutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
