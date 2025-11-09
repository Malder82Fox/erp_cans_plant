import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Form, FormField } from "../shared/components/Form";

import type { Part, PartPayload, PartUpdate } from "../../lib/apiClient";

const partSchema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().min(1, "Currency is required")
});

type PartFormValues = z.infer<typeof partSchema>;

type PartFormProps = {
  initial?: Part | null | undefined;
  mode: "create" | "edit";
  onSubmit: (payload: PartPayload | PartUpdate) => Promise<void> | void;
  isSubmitting?: boolean;
};

export function PartForm({ initial, mode, onSubmit, isSubmitting = false }: PartFormProps): JSX.Element {
  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues:
      mode === "edit" && initial
        ? {
            name: (initial as any)?.name ?? "",
            currency: (initial as any)?.currency ?? "USD"
          }
        : {
            name: "",
            currency: "USD"
          }
  });

  // обычная async-функция вместо SubmitHandler
  const submit = async (values: PartFormValues) => {
    if (mode === "create") {
      const payload: PartPayload = {
        name: values.name,
        currency: values.currency
      } as PartPayload;
      await onSubmit(payload);
    } else {
      const payload: PartUpdate = {
        name: values.name,
        currency: values.currency
      } as PartUpdate;
      await onSubmit(payload);
    }
  };

  return (
    <Form form={form} onSubmit={submit} submitLabel={mode === "create" ? "Create" : "Save"}>
      <FormField label={<Label htmlFor="name">Name</Label>} required error={form.formState.errors.name}>
        <Input id="name" placeholder="Part name" {...form.register("name")} disabled={isSubmitting} />
      </FormField>

      <FormField label={<Label htmlFor="currency">Currency</Label>} required error={form.formState.errors.currency}>
        <Input id="currency" placeholder="USD" {...form.register("currency")} disabled={isSubmitting} />
      </FormField>
    </Form>
  );
}
