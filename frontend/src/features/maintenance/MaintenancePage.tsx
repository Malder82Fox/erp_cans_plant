import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import {
  createEquipment,
  createPmPlan,
  createPmTemplate,
  createWorkOrder,
  generateDueWorkOrders,
  listEquipment,
  listMaintenanceHistory,
  listPmPlans,
  listPmTemplates,
  listWorkOrders,
  updateWorkOrder,
  type EquipmentPayload,
  type PMPlanPayload,
  type PMTemplatePayload,
  type WorkOrder,
  type WorkOrderPayload,
  type WorkOrderStatus
} from "../../lib/apiClient";
import { useAuth } from "../../lib/auth";
import { Form, FormField } from "../shared/components/Form";

const equipmentSchema = z.object({
  name: z.string().min(1),
  line: z.string().optional().or(z.literal("")),
  area: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal(""))
});
const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  frequency_days: z.coerce.number().min(1)
});
const planSchema = z.object({
  equipment_id: z.coerce.number().min(1),
  template_id: z.coerce.number().min(1),
  next_due_date: z.string().min(4)
});
const workOrderSchema = z.object({
  equipment_id: z.coerce.number().min(1),
  type: z.enum(["PM", "CM"]),
  summary: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal(""))
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;
type TemplateFormValues = z.infer<typeof templateSchema>;
type PlanFormValues = z.infer<typeof planSchema>;
type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export function MaintenancePage(): JSX.Element {
  const queryClient = useQueryClient();
  const {
    state: { user }
  } = useAuth();

  const equipmentQuery = useQuery({ queryKey: ["equipment"], queryFn: () => listEquipment() });
  const templatesQuery = useQuery({ queryKey: ["pmTemplates"], queryFn: () => listPmTemplates() });
  const plansQuery = useQuery({ queryKey: ["pmPlans"], queryFn: () => listPmPlans() });
  const workOrdersQuery = useQuery({ queryKey: ["workOrders"], queryFn: () => listWorkOrders() });
  const historyQuery = useQuery({ queryKey: ["maintenanceHistory"], queryFn: () => listMaintenanceHistory() });

  const canManage = user?.role === "admin" || user?.role === "root";

  const equipmentForm = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: { name: "", line: "", area: "", status: "" }
  });
  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", description: "", frequency_days: 30 }
  });
  const planForm = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { equipment_id: 0, template_id: 0, next_due_date: "" }
  });
  const workOrderForm = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: { equipment_id: 0, type: "PM", summary: "", due_date: "" }
  });

  planForm.register("equipment_id", { valueAsNumber: true });
  planForm.register("template_id", { valueAsNumber: true });
  workOrderForm.register("equipment_id", { valueAsNumber: true });
  workOrderForm.register("type");

  const createEquipmentMutation = useMutation({
    mutationFn: (payload: EquipmentPayload) => createEquipment(payload),
    onSuccess: () => {
      equipmentForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["equipment"] });
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: (payload: PMTemplatePayload) => createPmTemplate(payload),
    onSuccess: () => {
      templateForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["pmTemplates"] });
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: PMPlanPayload) => createPmPlan(payload),
    onSuccess: () => {
      planForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["pmPlans"] });
    }
  });

  const createWorkOrderMutation = useMutation({
    mutationFn: (payload: WorkOrderPayload) => createWorkOrder(payload),
    onSuccess: () => {
      workOrderForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["workOrders"] });
    }
  });

  useEffect(() => {
    if (canManage && equipmentQuery.data?.length && planForm.getValues("equipment_id") < 1) {
      planForm.setValue("equipment_id", equipmentQuery.data[0].id);
    }
  }, [canManage, equipmentQuery.data, planForm]);

  useEffect(() => {
    if (canManage && templatesQuery.data?.length && planForm.getValues("template_id") < 1) {
      planForm.setValue("template_id", templatesQuery.data[0].id);
    }
  }, [canManage, templatesQuery.data, planForm]);

  useEffect(() => {
    if (canManage && equipmentQuery.data?.length && workOrderForm.getValues("equipment_id") < 1) {
      workOrderForm.setValue("equipment_id", equipmentQuery.data[0].id);
    }
  }, [canManage, equipmentQuery.data, workOrderForm]);

  const updateWorkOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: WorkOrderStatus }) => updateWorkOrder(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workOrders"] });
    }
  });

  const generateMutation = useMutation({
    mutationFn: () => generateDueWorkOrders(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workOrders"] });
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Equipment</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <Form
              form={equipmentForm}
              onSubmit={async (values) => {
                await createEquipmentMutation.mutateAsync({
                  name: values.name,
                  line: values.line || undefined,
                  area: values.area || undefined,
                  status: values.status || undefined
                });
              }}
              submitLabel={createEquipmentMutation.isPending ? "Saving..." : "Add equipment"}
            >
              <FormField label={<Label htmlFor="equipment-name">Name</Label>} error={equipmentForm.formState.errors.name} required>
                <Input id="equipment-name" {...equipmentForm.register("name")} />
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label={<Label htmlFor="equipment-line">Line</Label>} error={equipmentForm.formState.errors.line}>
                  <Input id="equipment-line" {...equipmentForm.register("line")} />
                </FormField>
                <FormField label={<Label htmlFor="equipment-area">Area</Label>} error={equipmentForm.formState.errors.area}>
                  <Input id="equipment-area" {...equipmentForm.register("area")} />
                </FormField>
              </div>
              <FormField label={<Label htmlFor="equipment-status">Status</Label>} error={equipmentForm.formState.errors.status}>
                <Input id="equipment-status" {...equipmentForm.register("status")} />
              </FormField>
            </Form>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {equipmentQuery.data?.map((equipment) => (
              <div key={equipment.id} className="rounded-md border p-3">
                <div className="font-medium">{equipment.name}</div>
                <div className="text-xs text-muted-foreground">{equipment.line ?? ""}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">PM Templates</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <Form
              form={templateForm}
              onSubmit={async (values) => {
                await createTemplateMutation.mutateAsync({
                  name: values.name,
                  description: values.description || undefined,
                  frequency_days: values.frequency_days
                });
              }}
              submitLabel={createTemplateMutation.isPending ? "Saving..." : "Add template"}
            >
              <FormField label={<Label htmlFor="template-name">Name</Label>} error={templateForm.formState.errors.name} required>
                <Input id="template-name" {...templateForm.register("name")} />
              </FormField>
              <FormField label={<Label htmlFor="template-description">Description</Label>} error={templateForm.formState.errors.description}>
                <Input id="template-description" {...templateForm.register("description")} />
              </FormField>
              <FormField label={<Label htmlFor="template-frequency">Frequency (days)</Label>} error={templateForm.formState.errors.frequency_days}>
                <Input id="template-frequency" type="number" {...templateForm.register("frequency_days", { valueAsNumber: true })} />
              </FormField>
            </Form>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {templatesQuery.data?.map((template) => (
              <div key={template.id} className="rounded-md border p-3">
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground">Every {template.frequency_days} days</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">PM Plans</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <Form
              form={planForm}
              onSubmit={async (values) => {
                await createPlanMutation.mutateAsync({
                  equipment_id: values.equipment_id,
                  template_id: values.template_id,
                  next_due_date: values.next_due_date
                });
              }}
              submitLabel={createPlanMutation.isPending ? "Saving..." : "Add plan"}
            >
              <FormField label={<Label htmlFor="plan-equipment">Equipment</Label>} error={planForm.formState.errors.equipment_id} required>
                <Select
                  id="plan-equipment"
                  value={String(planForm.watch("equipment_id"))}
                  onChange={(event) => planForm.setValue("equipment_id", Number(event.target.value))}
                >
                  <option value="0">Select</option>
                  {equipmentQuery.data?.map((equipment) => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={<Label htmlFor="plan-template">Template</Label>} error={planForm.formState.errors.template_id} required>
                <Select
                  id="plan-template"
                  value={String(planForm.watch("template_id"))}
                  onChange={(event) => planForm.setValue("template_id", Number(event.target.value))}
                >
                  <option value="0">Select</option>
                  {templatesQuery.data?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={<Label htmlFor="plan-due">Next due date</Label>} error={planForm.formState.errors.next_due_date} required>
                <Input id="plan-due" type="date" {...planForm.register("next_due_date")} />
              </FormField>
            </Form>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {plansQuery.data?.map((plan) => (
              <div key={plan.id} className="rounded-md border p-3">
                <div className="font-medium">Plan #{plan.id}</div>
                <div className="text-xs text-muted-foreground">Next due: {plan.next_due_date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Work orders</h2>
            <p className="text-sm text-muted-foreground">Update status and track maintenance</p>
          </div>
          {canManage && (
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              Generate due
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <Form
              form={workOrderForm}
              onSubmit={async (values) => {
                await createWorkOrderMutation.mutateAsync({
                  equipment_id: values.equipment_id,
                  type: values.type,
                  summary: values.summary || undefined,
                  due_date: values.due_date || undefined
                });
              }}
              submitLabel={createWorkOrderMutation.isPending ? "Saving..." : "Create work order"}
            >
              <FormField label={<Label htmlFor="wo-equipment">Equipment</Label>} error={workOrderForm.formState.errors.equipment_id} required>
                <Select
                  id="wo-equipment"
                  value={String(workOrderForm.watch("equipment_id"))}
                  onChange={(event) => workOrderForm.setValue("equipment_id", Number(event.target.value))}
                >
                  <option value="0">Select</option>
                  {equipmentQuery.data?.map((equipment) => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={<Label htmlFor="wo-type">Type</Label>} error={workOrderForm.formState.errors.type} required>
                <Select
                  id="wo-type"
                  value={workOrderForm.watch("type")}
                  onChange={(event) => workOrderForm.setValue("type", event.target.value as WorkOrderFormValues["type"]) }
                >
                  <option value="PM">PM</option>
                  <option value="CM">CM</option>
                </Select>
              </FormField>
              <FormField label={<Label htmlFor="wo-summary">Summary</Label>} error={workOrderForm.formState.errors.summary}>
                <Input id="wo-summary" {...workOrderForm.register("summary")} />
              </FormField>
              <FormField label={<Label htmlFor="wo-due">Due date</Label>} error={workOrderForm.formState.errors.due_date}>
                <Input id="wo-due" type="date" {...workOrderForm.register("due_date")} />
              </FormField>
            </Form>
          )}
          <div className="space-y-2">
            {workOrdersQuery.data?.map((order) => (
              <WorkOrderCard key={order.id} order={order} onUpdate={(status) => updateWorkOrderMutation.mutate({ id: order.id, status })} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">History</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {historyQuery.isLoading ? (
            <div>Loading...</div>
          ) : historyQuery.data && historyQuery.data.length > 0 ? (
            historyQuery.data.map((record) => (
              <div key={record.id} className="rounded-md border p-3">
                <div className="font-medium">Work order #{record.work_order_id}</div>
                <div className="text-xs text-muted-foreground">Downtime: {record.downtime_min}</div>
                <div className="text-xs text-muted-foreground">Recorded: {record.recorded_at}</div>
                <div className="mt-2 text-sm">{record.summary}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No history available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WorkOrderCard({ order, onUpdate }: { order: WorkOrder; onUpdate: (status: WorkOrderStatus) => void }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
      <div>
        <div className="font-medium">{order.summary ?? `Work order #${order.id}`}</div>
        <div className="text-xs text-muted-foreground">Status: {order.status}</div>
      </div>
      <Select value={order.status} onChange={(event) => onUpdate(event.target.value as WorkOrderStatus)}>
        <option value="Open">Open</option>
        <option value="InProgress">InProgress</option>
        <option value="Done">Done</option>
        <option value="Canceled">Canceled</option>
      </Select>
    </div>
  );
}
