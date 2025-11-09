import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { createEquipment, createPmPlan, createPmTemplate, createWorkOrder, generateDueWorkOrders, listEquipment, listMaintenanceHistory, listPmPlans, listPmTemplates, listWorkOrders, updateWorkOrder } from "../../lib/apiClient";
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
export function MaintenancePage() {
    const queryClient = useQueryClient();
    const { state: { user } } = useAuth();
    const equipmentQuery = useQuery({ queryKey: ["equipment"], queryFn: () => listEquipment() });
    const templatesQuery = useQuery({ queryKey: ["pmTemplates"], queryFn: () => listPmTemplates() });
    const plansQuery = useQuery({ queryKey: ["pmPlans"], queryFn: () => listPmPlans() });
    const workOrdersQuery = useQuery({ queryKey: ["workOrders"], queryFn: () => listWorkOrders() });
    const historyQuery = useQuery({ queryKey: ["maintenanceHistory"], queryFn: () => listMaintenanceHistory() });
    const canManage = user?.role === "admin" || user?.role === "root";
    const equipmentForm = useForm({
        resolver: zodResolver(equipmentSchema),
        defaultValues: { name: "", line: "", area: "", status: "" }
    });
    const templateForm = useForm({
        resolver: zodResolver(templateSchema),
        defaultValues: { name: "", description: "", frequency_days: 30 }
    });
    const planForm = useForm({
        resolver: zodResolver(planSchema),
        defaultValues: { equipment_id: 0, template_id: 0, next_due_date: "" }
    });
    const workOrderForm = useForm({
        resolver: zodResolver(workOrderSchema),
        defaultValues: { equipment_id: 0, type: "PM", summary: "", due_date: "" }
    });
    planForm.register("equipment_id", { valueAsNumber: true });
    planForm.register("template_id", { valueAsNumber: true });
    workOrderForm.register("equipment_id", { valueAsNumber: true });
    workOrderForm.register("type");
    const createEquipmentMutation = useMutation({
        mutationFn: (payload) => createEquipment(payload),
        onSuccess: () => {
            equipmentForm.reset();
            void queryClient.invalidateQueries({ queryKey: ["equipment"] });
        }
    });
    const createTemplateMutation = useMutation({
        mutationFn: (payload) => createPmTemplate(payload),
        onSuccess: () => {
            templateForm.reset();
            void queryClient.invalidateQueries({ queryKey: ["pmTemplates"] });
        }
    });
    const createPlanMutation = useMutation({
        mutationFn: (payload) => createPmPlan(payload),
        onSuccess: () => {
            planForm.reset();
            void queryClient.invalidateQueries({ queryKey: ["pmPlans"] });
        }
    });
    const createWorkOrderMutation = useMutation({
        mutationFn: (payload) => createWorkOrder(payload),
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
        mutationFn: ({ id, status }) => updateWorkOrder(id, { status }),
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { className: "text-xl font-semibold", children: "Equipment" }) }), _jsxs(CardContent, { className: "space-y-4", children: [canManage && (_jsxs(Form, { form: equipmentForm, onSubmit: async (values) => {
                                    await createEquipmentMutation.mutateAsync({
                                        name: values.name,
                                        line: values.line || undefined,
                                        area: values.area || undefined,
                                        status: values.status || undefined
                                    });
                                }, submitLabel: createEquipmentMutation.isPending ? "Saving..." : "Add equipment", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "equipment-name", children: "Name" }), error: equipmentForm.formState.errors.name, required: true, children: _jsx(Input, { id: "equipment-name", ...equipmentForm.register("name") }) }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "equipment-line", children: "Line" }), error: equipmentForm.formState.errors.line, children: _jsx(Input, { id: "equipment-line", ...equipmentForm.register("line") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "equipment-area", children: "Area" }), error: equipmentForm.formState.errors.area, children: _jsx(Input, { id: "equipment-area", ...equipmentForm.register("area") }) })] }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "equipment-status", children: "Status" }), error: equipmentForm.formState.errors.status, children: _jsx(Input, { id: "equipment-status", ...equipmentForm.register("status") }) })] })), _jsx("div", { className: "grid gap-2 md:grid-cols-2", children: equipmentQuery.data?.map((equipment) => (_jsxs("div", { className: "rounded-md border p-3", children: [_jsx("div", { className: "font-medium", children: equipment.name }), _jsx("div", { className: "text-xs text-muted-foreground", children: equipment.line ?? "" })] }, equipment.id))) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { className: "text-xl font-semibold", children: "PM Templates" }) }), _jsxs(CardContent, { className: "space-y-4", children: [canManage && (_jsxs(Form, { form: templateForm, onSubmit: async (values) => {
                                    await createTemplateMutation.mutateAsync({
                                        name: values.name,
                                        description: values.description || undefined,
                                        frequency_days: values.frequency_days
                                    });
                                }, submitLabel: createTemplateMutation.isPending ? "Saving..." : "Add template", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "template-name", children: "Name" }), error: templateForm.formState.errors.name, required: true, children: _jsx(Input, { id: "template-name", ...templateForm.register("name") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "template-description", children: "Description" }), error: templateForm.formState.errors.description, children: _jsx(Input, { id: "template-description", ...templateForm.register("description") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "template-frequency", children: "Frequency (days)" }), error: templateForm.formState.errors.frequency_days, children: _jsx(Input, { id: "template-frequency", type: "number", ...templateForm.register("frequency_days", { valueAsNumber: true }) }) })] })), _jsx("div", { className: "grid gap-2 md:grid-cols-2", children: templatesQuery.data?.map((template) => (_jsxs("div", { className: "rounded-md border p-3", children: [_jsx("div", { className: "font-medium", children: template.name }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Every ", template.frequency_days, " days"] })] }, template.id))) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { className: "text-xl font-semibold", children: "PM Plans" }) }), _jsxs(CardContent, { className: "space-y-4", children: [canManage && (_jsxs(Form, { form: planForm, onSubmit: async (values) => {
                                    await createPlanMutation.mutateAsync({
                                        equipment_id: values.equipment_id,
                                        template_id: values.template_id,
                                        next_due_date: values.next_due_date
                                    });
                                }, submitLabel: createPlanMutation.isPending ? "Saving..." : "Add plan", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "plan-equipment", children: "Equipment" }), error: planForm.formState.errors.equipment_id, required: true, children: _jsxs(Select, { id: "plan-equipment", value: String(planForm.watch("equipment_id")), onChange: (event) => planForm.setValue("equipment_id", Number(event.target.value)), children: [_jsx("option", { value: "0", children: "Select" }), equipmentQuery.data?.map((equipment) => (_jsx("option", { value: equipment.id, children: equipment.name }, equipment.id)))] }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "plan-template", children: "Template" }), error: planForm.formState.errors.template_id, required: true, children: _jsxs(Select, { id: "plan-template", value: String(planForm.watch("template_id")), onChange: (event) => planForm.setValue("template_id", Number(event.target.value)), children: [_jsx("option", { value: "0", children: "Select" }), templatesQuery.data?.map((template) => (_jsx("option", { value: template.id, children: template.name }, template.id)))] }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "plan-due", children: "Next due date" }), error: planForm.formState.errors.next_due_date, required: true, children: _jsx(Input, { id: "plan-due", type: "date", ...planForm.register("next_due_date") }) })] })), _jsx("div", { className: "grid gap-2 md:grid-cols-2", children: plansQuery.data?.map((plan) => (_jsxs("div", { className: "rounded-md border p-3", children: [_jsxs("div", { className: "font-medium", children: ["Plan #", plan.id] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Next due: ", plan.next_due_date] })] }, plan.id))) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: "Work orders" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Update status and track maintenance" })] }), canManage && (_jsx(Button, { onClick: () => generateMutation.mutate(), disabled: generateMutation.isPending, children: "Generate due" }))] }), _jsxs(CardContent, { className: "space-y-4", children: [canManage && (_jsxs(Form, { form: workOrderForm, onSubmit: async (values) => {
                                    await createWorkOrderMutation.mutateAsync({
                                        equipment_id: values.equipment_id,
                                        type: values.type,
                                        summary: values.summary || undefined,
                                        due_date: values.due_date || undefined
                                    });
                                }, submitLabel: createWorkOrderMutation.isPending ? "Saving..." : "Create work order", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "wo-equipment", children: "Equipment" }), error: workOrderForm.formState.errors.equipment_id, required: true, children: _jsxs(Select, { id: "wo-equipment", value: String(workOrderForm.watch("equipment_id")), onChange: (event) => workOrderForm.setValue("equipment_id", Number(event.target.value)), children: [_jsx("option", { value: "0", children: "Select" }), equipmentQuery.data?.map((equipment) => (_jsx("option", { value: equipment.id, children: equipment.name }, equipment.id)))] }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "wo-type", children: "Type" }), error: workOrderForm.formState.errors.type, required: true, children: _jsxs(Select, { id: "wo-type", value: workOrderForm.watch("type"), onChange: (event) => workOrderForm.setValue("type", event.target.value), children: [_jsx("option", { value: "PM", children: "PM" }), _jsx("option", { value: "CM", children: "CM" })] }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "wo-summary", children: "Summary" }), error: workOrderForm.formState.errors.summary, children: _jsx(Input, { id: "wo-summary", ...workOrderForm.register("summary") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "wo-due", children: "Due date" }), error: workOrderForm.formState.errors.due_date, children: _jsx(Input, { id: "wo-due", type: "date", ...workOrderForm.register("due_date") }) })] })), _jsx("div", { className: "space-y-2", children: workOrdersQuery.data?.map((order) => (_jsx(WorkOrderCard, { order: order, onUpdate: (status) => updateWorkOrderMutation.mutate({ id: order.id, status }) }, order.id))) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { className: "text-xl font-semibold", children: "History" }) }), _jsx(CardContent, { className: "space-y-2", children: historyQuery.isLoading ? (_jsx("div", { children: "Loading..." })) : historyQuery.data && historyQuery.data.length > 0 ? (historyQuery.data.map((record) => (_jsxs("div", { className: "rounded-md border p-3", children: [_jsxs("div", { className: "font-medium", children: ["Work order #", record.work_order_id] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Downtime: ", record.downtime_min] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Recorded: ", record.recorded_at] }), _jsx("div", { className: "mt-2 text-sm", children: record.summary })] }, record.id)))) : (_jsx("div", { className: "text-sm text-muted-foreground", children: "No history available." })) })] })] }));
}
function WorkOrderCard({ order, onUpdate }) {
    return (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 rounded-md border p-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: order.summary ?? `Work order #${order.id}` }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Status: ", order.status] })] }), _jsxs(Select, { value: order.status, onChange: (event) => onUpdate(event.target.value), children: [_jsx("option", { value: "Open", children: "Open" }), _jsx("option", { value: "InProgress", children: "InProgress" }), _jsx("option", { value: "Done", children: "Done" }), _jsx("option", { value: "Canceled", children: "Canceled" })] })] }));
}
