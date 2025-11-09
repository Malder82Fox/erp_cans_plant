import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { type Part, type PartPayload, type PartUpdate } from "../../lib/apiClient";
import { Form, FormField } from "../shared/components/Form";

const createSchema = z.object({
  part_code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  qty_on_hand: z.string().optional().or(z.literal("")),
  min_stock: z.string().optional().or(z.literal("")),
  price: z.string().optional().or(z.literal("")),
  currency: z.string().length(3).optional().or(z.literal(""))
});

type FormValues = z.infer<typeof createSchema>;

interface PartFormProps {
  initial?: Part;
  onSubmit: (payload: PartPayload | PartUpdate) => Promise<void> | void;
  mode: "create" | "edit";
  isSubmitting?: boolean;
}

function toFormValues(part?: Part): FormValues {
  if (!part) {
    return { part_code: "", name: "", description: "", qty_on_hand: "", min_stock: "", price: "", currency: "USD" };
  }
  return {
    part_code: part.part_code,
    name: part.name,
    description: part.description ?? "",
    qty_on_hand: part.qty_on_hand,
    min_stock: part.min_stock,
    price: part.price,
    currency: part.currency
  };
}

function normalize(values: FormValues, mode: "create" | "edit"): PartPayload | PartUpdate {
  const payload: PartPayload = {
    part_code: values.part_code,
    name: values.name,
    description: values.description || undefined,
    qty_on_hand: values.qty_on_hand ? Number(values.qty_on_hand) : undefined,
    min_stock: values.min_stock ? Number(values.min_stock) : undefined,
    price: values.price ? Number(values.price) : undefined,
    currency: values.currency ? values.currency.toUpperCase() : undefined
  };
  if (mode === "edit") {
    const { part_code, ...rest } = payload;
    return rest;
  }
  return payload;
}

export function PartForm({ initial, onSubmit, mode, isSubmitting = false }: PartFormProps): JSX.Element {
  const form = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: toFormValues(initial)
  });
  useEffect(() => {
    form.reset(toFormValues(initial));
  }, [initial, form]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(normalize(values, mode));
  };

  return (
    <Form form={form} onSubmit={handleSubmit} submitLabel={isSubmitting ? "Saving..." : "Save"}>
      <FormField label={<Label htmlFor="part_code">Part code</Label>} error={form.formState.errors.part_code} required>
        <Input id="part_code" disabled={mode === "edit"} {...form.register("part_code")} />
      </FormField>
      <FormField label={<Label htmlFor="name">Name</Label>} error={form.formState.errors.name} required>
        <Input id="name" {...form.register("name")} />
      </FormField>
      <FormField label={<Label htmlFor="description">Description</Label>} error={form.formState.errors.description}>
        <Textarea id="description" rows={3} {...form.register("description")} />
      </FormField>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField label={<Label htmlFor="qty_on_hand">Qty on hand</Label>} error={form.formState.errors.qty_on_hand}>
          <Input id="qty_on_hand" type="number" step="0.01" {...form.register("qty_on_hand")} />
        </FormField>
        <FormField label={<Label htmlFor="min_stock">Min stock</Label>} error={form.formState.errors.min_stock}>
          <Input id="min_stock" type="number" step="0.01" {...form.register("min_stock")} />
        </FormField>
        <FormField label={<Label htmlFor="price">Price</Label>} error={form.formState.errors.price}>
          <Input id="price" type="number" step="0.01" {...form.register("price")} />
        </FormField>
      </div>
      <FormField label={<Label htmlFor="currency">Currency</Label>} error={form.formState.errors.currency}>
        <Input id="currency" maxLength={3} {...form.register("currency")} />
      </FormField>
    </Form>
  );
}
