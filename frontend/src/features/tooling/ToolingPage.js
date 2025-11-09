import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const batchSchema = z.object({
    name: z.string().min(1, "Name is required"),
    status: z.string().default("Open"),
    tool_ids: z.array(z.number()).default([])
});
const toolSchema = z.object({
    name: z.string().min(1, "Name is required"),
    tool_type: z.string().min(1, "Tool type is required"),
    status: z.string().optional()
});
export default function ToolingPage() {
    const qc = useQueryClient();
    // lists
    const batchesQuery = useQuery({
        queryKey: ["tooling", "batches"],
        queryFn: () => api.listBatches()
    });
    const toolsQuery = useQuery({
        queryKey: ["tooling", "tools"],
        queryFn: () => api.listTools()
    });
    // create forms
    const batchForm = useForm({
        resolver: zodResolver(batchSchema),
        defaultValues: { name: "", status: "Open", tool_ids: [] }
    });
    const toolForm = useForm({
        resolver: zodResolver(toolSchema),
        defaultValues: { name: "", tool_type: "", status: undefined }
    });
    // mutations
    const createBatchMutation = useMutation({
        mutationFn: (payload) => api.createBatch(payload),
        onSuccess: () => {
            batchForm.reset();
            qc.invalidateQueries({ queryKey: ["tooling", "batches"] });
            console.log("Batch created");
        }
    });
    const createToolMutation = useMutation({
        mutationFn: (payload) => api.createTool(payload),
        onSuccess: () => {
            toolForm.reset();
            qc.invalidateQueries({ queryKey: ["tooling", "tools"] });
            console.log("Tool created");
        }
    });
    const updateBatchMutation = useMutation({
        mutationFn: ({ id, patch }) => api.updateBatch(id, patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tooling", "batches"] });
            console.log("Batch updated");
        }
    });
    const updateToolMutation = useMutation({
        mutationFn: ({ id, patch }) => api.updateTool(id, patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tooling", "tools"] });
            console.log("Tool updated");
        }
    });
    // onSubmit как обычная async-функция, без SubmitHandler
    const onCreateBatch = async (values) => {
        await createBatchMutation.mutateAsync({
            name: values.name,
            status: values.status, // приводим к типу API
            tool_ids: values.tool_ids
        });
    };
    const onCreateTool = async (values) => {
        await createToolMutation.mutateAsync({
            name: values.name,
            tool_type: values.tool_type,
            status: values.status
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: "Batches" }) }), _jsx(CardContent, { children: batchesQuery.isLoading ? (_jsx("p", { children: "Loading\u2026" })) : (_jsx("ul", { className: "space-y-2", children: (batchesQuery.data ?? []).map((b) => {
                                const current = String(b.status);
                                const next = current === "Open" ? "InProgress" : current === "InProgress" ? "Done" : "Open";
                                return (_jsxs("li", { className: "flex items-center justify-between rounded border p-2", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: b.name }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["status: ", String(b.status)] })] }), _jsxs(Button, { className: "ml-4", variant: "secondary", onClick: () => updateBatchMutation.mutate({ id: b.id, patch: { status: next } }), children: ["Set ", next] })] }, b.id));
                            }) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: "Tools" }) }), _jsx(CardContent, { children: toolsQuery.isLoading ? (_jsx("p", { children: "Loading\u2026" })) : (_jsx("ul", { className: "space-y-2", children: (toolsQuery.data ?? []).map((t) => (_jsxs("li", { className: "flex items-center justify-between rounded border p-2", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: t.name }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["type: ", t.tool_type, " ", t.status ? `• status: ${String(t.status)}` : ""] })] }), _jsx(Button, { className: "ml-4", variant: "secondary", onClick: () => updateToolMutation.mutate({ id: t.id, patch: { status: "active" } }), children: "Activate" })] }, t.id))) })) })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: "Create Batch" }) }), _jsx(CardContent, { children: _jsxs(Form, { form: batchForm, onSubmit: onCreateBatch, submitLabel: "Create Batch", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "batch_name", children: "Name" }), required: true, error: batchForm.formState.errors.name, children: _jsx(Input, { id: "batch_name", placeholder: "Batch name", ...batchForm.register("name") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "batch_status", children: "Status" }), children: _jsxs("select", { id: "batch_status", className: "w-full rounded border px-3 py-2 text-sm", value: batchForm.watch("status"), onChange: (e) => batchForm.setValue("status", e.target.value), children: [_jsx("option", { value: "Open", children: "Open" }), _jsx("option", { value: "InProgress", children: "InProgress" }), _jsx("option", { value: "Done", children: "Done" }), _jsx("option", { value: "Hold", children: "Hold" })] }) }), (() => {
                                            const raw = batchForm.formState.errors?.tool_ids;
                                            const toolIdsError = Array.isArray(raw) ? raw[0] : raw;
                                            return (_jsx(FormField, { label: _jsx(Label, { children: "Tools" }), error: toolIdsError, children: _jsx("div", { className: "grid gap-2 md:grid-cols-2", children: (toolsQuery.data ?? []).map((tool) => {
                                                        const selected = batchForm.watch("tool_ids")?.includes(tool.id) ?? false;
                                                        return (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: selected, onChange: (event) => {
                                                                        const current = new Set(batchForm.watch("tool_ids") ?? []);
                                                                        if (event.target.checked)
                                                                            current.add(tool.id);
                                                                        else
                                                                            current.delete(tool.id);
                                                                        batchForm.setValue("tool_ids", Array.from(current));
                                                                    } }), tool.name] }, tool.id));
                                                    }) }) }));
                                        })()] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: "Create Tool" }) }), _jsx(CardContent, { children: _jsxs(Form, { form: toolForm, onSubmit: onCreateTool, submitLabel: "Create Tool", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "tool_name", children: "Name" }), required: true, error: toolForm.formState.errors.name, children: _jsx(Input, { id: "tool_name", placeholder: "Tool name", ...toolForm.register("name") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "tool_type", children: "Type" }), required: true, error: toolForm.formState.errors.tool_type, children: _jsx(Input, { id: "tool_type", placeholder: "e.g. die, punch, mandrel", ...toolForm.register("tool_type") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "tool_status", children: "Status" }), children: _jsx(Input, { id: "tool_status", placeholder: "optional", ...toolForm.register("status") }) })] }) })] })] })] }));
}
