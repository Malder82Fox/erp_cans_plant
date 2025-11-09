import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Form, FormField } from "../shared/components/Form";
const partSchema = z.object({
    name: z.string().min(1, "Name is required"),
    currency: z.string().min(1, "Currency is required")
});
export function PartForm({ initial, mode, onSubmit, isSubmitting = false }) {
    const form = useForm({
        resolver: zodResolver(partSchema),
        defaultValues: mode === "edit" && initial
            ? {
                name: initial?.name ?? "",
                currency: initial?.currency ?? "USD"
            }
            : {
                name: "",
                currency: "USD"
            }
    });
    // обычная async-функция вместо SubmitHandler
    const submit = async (values) => {
        if (mode === "create") {
            const payload = {
                name: values.name,
                currency: values.currency
            };
            await onSubmit(payload);
        }
        else {
            const payload = {
                name: values.name,
                currency: values.currency
            };
            await onSubmit(payload);
        }
    };
    return (_jsxs(Form, { form: form, onSubmit: submit, submitLabel: mode === "create" ? "Create" : "Save", children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "name", children: "Name" }), required: true, error: form.formState.errors.name, children: _jsx(Input, { id: "name", placeholder: "Part name", ...form.register("name"), disabled: isSubmitting }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "currency", children: "Currency" }), required: true, error: form.formState.errors.currency, children: _jsx(Input, { id: "currency", placeholder: "USD", ...form.register("currency"), disabled: isSubmitting }) })] }));
}
