import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import {
  createBatch,
  createTool,
  deleteTool,
  getToolDimensions,
  listBatches,
  listTools,
  runBatchOperation,
  updateBatch,
  updateTool,
  type Batch,
  type BatchOperationRequest,
  type BatchUpdatePayload,
  type Tool,
  type ToolPayload,
  type ToolUpdatePayload
} from "../../lib/apiClient";
import { useAuth } from "../../lib/auth";
import { Form, FormField } from "../shared/components/Form";
import { Badge } from "../../components/ui/badge";

const toolSchema = z.object({
  name: z.string().min(1),
  tool_type: z.string().min(1),
  bm_no: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal("available"))
});

const batchSchema = z.object({
  name: z.string().min(1),
  status: z.string().optional().or(z.literal("Queued")),
  tool_ids: z.array(z.coerce.number()).optional()
});

const operationSchema = z
  .object({
    op_type: z.enum(["inspection", "cleaning", "grinding"]),
    apply_to_all: z.boolean(),
    tool_id: z.number().optional(),
    dim_name: z.string().optional(),
    new_value: z.coerce.number().optional()
  })
  .superRefine((values, ctx) => {
    if (!values.apply_to_all) {
      if (!values.tool_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tool is required", path: ["tool_id"] });
      }
      if (!values.dim_name) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dimension is required", path: ["dim_name"] });
      }
      if (values.new_value === undefined || Number.isNaN(values.new_value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New value is required", path: ["new_value"] });
      }
    }
  });

type ToolFormValues = z.infer<typeof toolSchema>;
type BatchFormValues = z.infer<typeof batchSchema>;
type OperationFormValues = z.infer<typeof operationSchema>;

export function ToolingPage(): JSX.Element {
  const queryClient = useQueryClient();
  const {
    state: { user }
  } = useAuth();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const toolsQuery = useQuery({ queryKey: ["tools"], queryFn: () => listTools() });
  const batchesQuery = useQuery({ queryKey: ["batches"], queryFn: () => listBatches() });
  const dimsQuery = useQuery({
    queryKey: ["tool", selectedTool?.id, "dims"],
    queryFn: () => getToolDimensions(selectedTool!.id),
    enabled: Boolean(selectedTool?.id)
  });

  const canManage = user?.role === "admin" || user?.role === "root";
  const canDelete = user?.role === "root";

  const toolForm = useForm<ToolFormValues>({
    resolver: zodResolver(toolSchema),
    defaultValues: { name: "", tool_type: "", bm_no: "", status: "available" }
  });

  const batchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: { name: "", status: "Queued", tool_ids: [] }
  });
  batchForm.register("tool_ids");

  const operationForm = useForm<OperationFormValues>({
    resolver: zodResolver(operationSchema),
    defaultValues: { op_type: "inspection", apply_to_all: true }
  });
  operationForm.register("apply_to_all");
  operationForm.register("op_type");

  const createToolMutation = useMutation({
    mutationFn: (payload: ToolPayload) => createTool(payload),
    onSuccess: () => {
      toolForm.reset({ name: "", tool_type: "", bm_no: "", status: "available" });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    }
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ToolUpdatePayload }) => updateTool(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    }
  });

  const deleteToolMutation = useMutation({
    mutationFn: (id: number) => deleteTool(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    }
  });

  const createBatchMutation = useMutation({
    mutationFn: (payload: BatchFormValues) =>
      createBatch({ name: payload.name, status: payload.status as Batch["status"], tool_ids: payload.tool_ids ?? [] }),
    onSuccess: () => {
      batchForm.reset({ name: "", status: "Queued", tool_ids: [] });
      void queryClient.invalidateQueries({ queryKey: ["batches"] });
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Batch["status"] }) => updateBatch(id, { status } satisfies BatchUpdatePayload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["batches"] });
    }
  });

  const operationMutation = useMutation({
    mutationFn: async (values: OperationFormValues) => {
      if (!selectedBatch) {
        throw new Error("No batch selected");
      }
      const payload: BatchOperationRequest = {
        op_type: values.op_type,
        apply_to_all: values.apply_to_all,
        changes: values.apply_to_all
          ? []
          : [
              {
                tool_id: values.tool_id,
                changes: values.dim_name && values.new_value ? [{ dim_name: values.dim_name, new_value: values.new_value }] : []
              }
            ]
      };
      return runBatchOperation(selectedBatch.id, payload);
    },
    onSuccess: () => {
      operationForm.reset({ op_type: "inspection", apply_to_all: true, tool_id: undefined, dim_name: "", new_value: undefined });
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Tools</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <Form
              form={toolForm}
              onSubmit={async (values) => {
                await createToolMutation.mutateAsync({
                  name: values.name,
                  tool_type: values.tool_type,
                  bm_no: values.bm_no || undefined,
                  status: values.status || undefined
                });
              }}
              submitLabel={createToolMutation.isPending ? "Saving..." : "Add tool"}
            >
              <FormField label={<Label htmlFor="tool-name">Name</Label>} error={toolForm.formState.errors.name} required>
                <Input id="tool-name" {...toolForm.register("name")} />
              </FormField>
              <FormField label={<Label htmlFor="tool-type">Type</Label>} error={toolForm.formState.errors.tool_type} required>
                <Input id="tool-type" {...toolForm.register("tool_type")} />
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label={<Label htmlFor="tool-bm">BM #</Label>} error={toolForm.formState.errors.bm_no}>
                  <Input id="tool-bm" {...toolForm.register("bm_no")} />
                </FormField>
                <FormField label={<Label htmlFor="tool-status">Status</Label>} error={toolForm.formState.errors.status}>
                  <Input id="tool-status" {...toolForm.register("status")} />
                </FormField>
              </div>
            </Form>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {toolsQuery.data?.map((tool) => (
              <div key={tool.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-muted-foreground">{tool.tool_type}</div>
                  </div>
                  <Badge variant="secondary">{tool.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setSelectedTool(tool)}>
                    Dimensions
                  </Button>
                  {canManage && (
                    <Button
                      variant="secondary"
                      onClick={() => updateToolMutation.mutate({ id: tool.id, payload: { status: tool.status === "available" ? "maintenance" : "available" } })}
                    >
                      Toggle status
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" onClick={() => deleteToolMutation.mutate(tool.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedTool && (
            <div className="rounded-md border p-3">
              <h3 className="font-semibold">Dimensions for {selectedTool.name}</h3>
              {dimsQuery.isLoading ? (
                <div>Loading...</div>
              ) : dimsQuery.data ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {dimsQuery.data.current.map((dim) => (
                    <div key={dim.id} className="rounded border p-2 text-sm">
                      {dim.dim_name}: {dim.value}
                    </div>
                  ))}
                </div>
              ) : (
                <div>No dimensions</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Batches</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <Form
              form={batchForm}
              onSubmit={async (values) => {
                await createBatchMutation.mutateAsync({
                  name: values.name,
                  status: values.status ?? "Queued",
                  tool_ids: values.tool_ids ?? []
                });
              }}
              submitLabel={createBatchMutation.isPending ? "Saving..." : "Add batch"}
            >
              <FormField label={<Label htmlFor="batch-name">Name</Label>} error={batchForm.formState.errors.name} required>
                <Input id="batch-name" {...batchForm.register("name")} />
              </FormField>
              <FormField label={<Label htmlFor="batch-status">Status</Label>} error={batchForm.formState.errors.status}>
                <Input id="batch-status" {...batchForm.register("status")} />
              </FormField>
              <FormField label={<Label>Tools</Label>} error={batchForm.formState.errors.tool_ids}>
                <div className="grid gap-2 md:grid-cols-2">
                  {toolsQuery.data?.map((tool) => {
                    const selected = batchForm.watch("tool_ids")?.includes(tool.id) ?? false;
                    return (
                      <label key={tool.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => {
                            const current = new Set(batchForm.watch("tool_ids") ?? []);
                            if (event.target.checked) {
                              current.add(tool.id);
                            } else {
                              current.delete(tool.id);
                            }
                            batchForm.setValue("tool_ids", Array.from(current));
                          }}
                        />
                        {tool.name}
                      </label>
                    );
                  })}
                </div>
              </FormField>
            </Form>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {batchesQuery.data?.map((batch) => (
              <div key={batch.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{batch.name}</div>
                    <div className="text-xs text-muted-foreground">Status: {batch.status}</div>
                  </div>
                  {canManage && (
                    <Select
                      value={batch.status}
                      onChange={(event) => updateBatchMutation.mutate({ id: batch.id, status: event.target.value as Batch["status"] })}
                    >
                      <option value="Queued">Queued</option>
                      <option value="Processed">Processed</option>
                      <option value="Skipped">Skipped</option>
                    </Select>
                  )}
                </div>
                <Button variant="secondary" onClick={() => setSelectedBatch(batch)}>
                  Select for operation
                </Button>
              </div>
            ))}
          </div>
          {selectedBatch && canManage && (
            <div className="rounded-md border p-4">
              <h3 className="font-semibold">Run operation for {selectedBatch.name}</h3>
              <Form
                form={operationForm}
                onSubmit={async (values) => {
                  await operationMutation.mutateAsync(values);
                }}
                submitLabel={operationMutation.isPending ? "Processing..." : "Execute"}
              >
                <FormField label={<Label htmlFor="op-type">Operation</Label>} error={operationForm.formState.errors.op_type}>
                  <Select
                    id="op-type"
                    value={operationForm.watch("op_type")}
                    onChange={(event) => operationForm.setValue("op_type", event.target.value as OperationFormValues["op_type"])}
                  >
                    <option value="inspection">Inspection</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="grinding">Grinding</option>
                  </Select>
                </FormField>
                <FormField label={<Label htmlFor="op-all">Apply to all</Label>} error={operationForm.formState.errors.apply_to_all}>
                  <input
                    id="op-all"
                    type="checkbox"
                    checked={operationForm.watch("apply_to_all")}
                    onChange={(event) => operationForm.setValue("apply_to_all", event.target.checked)}
                  />
                </FormField>
                {!operationForm.watch("apply_to_all") && (
                  <div className="grid gap-2 md:grid-cols-3">
                    <FormField label={<Label htmlFor="op-tool">Tool ID</Label>} error={operationForm.formState.errors.tool_id}>
                      <Input id="op-tool" type="number" {...operationForm.register("tool_id", { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={<Label htmlFor="op-dim">Dimension</Label>} error={operationForm.formState.errors.dim_name}>
                      <Input id="op-dim" {...operationForm.register("dim_name")} />
                    </FormField>
                    <FormField label={<Label htmlFor="op-value">New value</Label>} error={operationForm.formState.errors.new_value}>
                      <Input id="op-value" type="number" step="0.001" {...operationForm.register("new_value", { valueAsNumber: true })} />
                    </FormField>
                  </div>
                )}
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
