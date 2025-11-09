import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { createUser } from "../../lib/apiClient";
import { Form, FormField } from "../shared/components/Form";
const schema = z.object({
    username: z.string().min(2),
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().min(8),
    role: z.custom(),
    must_change_password: z.boolean().default(true)
});
export function CreateUserDialog({ onCreated }) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            role: "admin",
            must_change_password: true
        }
    });
    form.register("role");
    form.register("must_change_password");
    const mutation = useMutation({
        mutationFn: (values) => createUser({
            username: values.username,
            email: values.email ? values.email : null,
            password: values.password,
            role: values.role,
            must_change_password: values.must_change_password
        }),
        onSuccess: (user) => {
            onCreated(user);
            setOpen(false);
            form.reset();
        }
    });
    const onSubmit = async (values) => {
        await mutation.mutateAsync(values);
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { children: t("users.create") }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t("users.create") }) }), _jsxs(Form, { form: form, onSubmit: onSubmit, submitLabel: mutation.isPending ? t("app.loading") : t("users.create"), children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "username", children: t("auth.username") }), error: form.formState.errors.username, required: true, children: _jsx(Input, { id: "username", ...form.register("username") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "email", children: t("users.email") }), error: form.formState.errors.email, children: _jsx(Input, { id: "email", type: "email", ...form.register("email") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "password", children: t("auth.temporaryPassword") }), error: form.formState.errors.password, required: true, children: _jsx(Input, { id: "password", type: "password", ...form.register("password") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "role", children: t("users.role") }), error: form.formState.errors.role, children: _jsxs(Select, { id: "role", value: form.watch("role"), onChange: (event) => form.setValue("role", event.target.value), children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "root", children: "Root" })] }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "must_change_password", children: t("auth.mustChange") }), children: _jsx("input", { id: "must_change_password", type: "checkbox", className: "h-4 w-4", checked: form.watch("must_change_password"), onChange: (event) => form.setValue("must_change_password", event.target.checked) }) })] })] })] }));
}
