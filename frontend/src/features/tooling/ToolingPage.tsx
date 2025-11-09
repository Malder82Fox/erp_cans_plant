import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Form, FormField } from "../shared/components/Form";
import * as api from "../../lib/apiClient";

// Типы с бэка, но статус используем как string, чтобы избежать несоответствий литералам
type Batch = api.Batch;
type Tool = api.Tool;

const batchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.string().default("Open"),
  tool_ids: z.array(z.number()).default([])
});
type BatchForm = z.infer<typeof batchSchema>;

const toolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tool_type: z.string().min(1, "Tool type is required"),
  status: z.string().optional()
});
type ToolForm = z.infer<typeof toolSchema>;

export default function ToolingPage(): JSX.Element {
  const qc = useQueryClient();

  // lists
  const batchesQuery = useQuery<Batch[]>({
    queryKey: ["tooling", "batches"],
    queryFn: () => api.listBatches()
  });

  const toolsQuery = useQuery<Tool[]>({
    queryKey: ["tooling", "tools"],
    queryFn: () => api.listTools()
  });

  // create forms
  const batchForm = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: { name: "", status: "Open", tool_ids: [] }
  });

  const toolForm = useForm<ToolForm>({
    resolver: zodResolver(toolSchema),
    defaultValues: { name: "", tool_type: "", status: undefined }
  });

  // mutations
  const createBatchMutation = useMutation({
    mutationFn: (payload: api.BatchPayload) => api.createBatch(payload),
    onSuccess: () => {
      batchForm.reset();
      qc.invalidateQueries({ queryKey: ["tooling", "batches"] });
      console.log("Batch created");
    }
  });

  const createToolMutation = useMutation({
    mutationFn: (payload: api.ToolPayload) => api.createTool(payload),
    onSuccess: () => {
      toolForm.reset();
      qc.invalidateQueries({ queryKey: ["tooling", "tools"] });
      console.log("Tool created");
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: api.BatchUpdatePayload }) => api.updateBatch(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tooling", "batches"] });
      console.log("Batch updated");
    }
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: api.ToolUpdatePayload }) => api.updateTool(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tooling", "tools"] });
      console.log("Tool updated");
    }
  });

  // onSubmit как обычная async-функция, без SubmitHandler
  const onCreateBatch = async (values: BatchForm) => {
    await createBatchMutation.mutateAsync({
      name: values.name,
      status: values.status as any, // приводим к типу API
      tool_ids: values.tool_ids
    });
  };

  const onCreateTool = async (values: ToolForm) => {
    await createToolMutation.mutateAsync({
      name: values.name,
      tool_type: values.tool_type,
      status: values.status
    });
  };

  return (
    <div className="space-y-6">
      {/* Batches */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Batches</h3>
        </CardHeader>
        <CardContent>
          {batchesQuery.isLoading ? (
            <p>Loading…</p>
          ) : (
            <ul className="space-y-2">
              {(batchesQuery.data ?? []).map((b) => {
                const current = String(b.status);
                const next = current === "Open" ? "InProgress" : current === "InProgress" ? "Done" : "Open";
                return (
                  <li key={b.id} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground">status: {String(b.status)}</div>
                    </div>
                    <Button
                      className="ml-4"
                      variant="secondary"
                      onClick={() => updateBatchMutation.mutate({ id: b.id, patch: { status: next as any } })}
                    >
                      Set {next}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tools</h3>
        </CardHeader>
        <CardContent>
          {toolsQuery.isLoading ? (
            <p>Loading…</p>
          ) : (
            <ul className="space-y-2">
              {(toolsQuery.data ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      type: {t.tool_type} {t.status ? `• status: ${String(t.status)}` : ""}
                    </div>
                  </div>
                  <Button
                    className="ml-4"
                    variant="secondary"
                    onClick={() => updateToolMutation.mutate({ id: t.id, patch: { status: "active" as any } })}
                  >
                    Activate
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Create forms */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Create Batch</h3>
          </CardHeader>
          <CardContent>
            <Form form={batchForm} onSubmit={onCreateBatch} submitLabel="Create Batch">
              <FormField label={<Label htmlFor="batch_name">Name</Label>} required error={batchForm.formState.errors.name}>
                <Input id="batch_name" placeholder="Batch name" {...batchForm.register("name")} />
              </FormField>

              <FormField label={<Label htmlFor="batch_status">Status</Label>}>
                <select
                  id="batch_status"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={batchForm.watch("status")}
                  onChange={(e) => batchForm.setValue("status", e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Done">Done</option>
                  <option value="Hold">Hold</option>
                </select>
              </FormField>

              {(() => {
                const raw = (batchForm.formState.errors as any)?.tool_ids;
                const toolIdsError = Array.isArray(raw) ? raw[0] : raw;

                return (
                  <FormField label={<Label>Tools</Label>} error={toolIdsError}>
                    <div className="grid gap-2 md:grid-cols-2">
                      {(toolsQuery.data ?? []).map((tool) => {
                        const selected = batchForm.watch("tool_ids")?.includes(tool.id) ?? false;
                        return (
                          <label key={tool.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const current = new Set(batchForm.watch("tool_ids") ?? []);
                                if (event.target.checked) current.add(tool.id);
                                else current.delete(tool.id);
                                batchForm.setValue("tool_ids", Array.from(current));
                              }}
                            />
                            {tool.name}
                          </label>
                        );
                      })}
                    </div>
                  </FormField>
                );
              })()}
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Create Tool</h3>
          </CardHeader>
          <CardContent>
            <Form form={toolForm} onSubmit={onCreateTool} submitLabel="Create Tool">
              <FormField label={<Label htmlFor="tool_name">Name</Label>} required error={toolForm.formState.errors.name}>
                <Input id="tool_name" placeholder="Tool name" {...toolForm.register("name")} />
              </FormField>

              <FormField label={<Label htmlFor="tool_type">Type</Label>} required error={toolForm.formState.errors.tool_type}>
                <Input id="tool_type" placeholder="e.g. die, punch, mandrel" {...toolForm.register("tool_type")} />
              </FormField>

              <FormField label={<Label htmlFor="tool_status">Status</Label>}>
                <Input id="tool_status" placeholder="optional" {...toolForm.register("status")} />
              </FormField>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
