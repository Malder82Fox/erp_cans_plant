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
import { resetUserPassword } from "../../lib/apiClient";
import { Form, FormField } from "../shared/components/Form";
const schema = z.object({
    temporary_password: z.string().min(8),
    must_change_password: z.boolean().default(true)
});
export function ResetPasswordDialog({ userId, onReset }) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            temporary_password: "",
            must_change_password: true
        }
    });
    form.register("must_change_password");
    const mutation = useMutation({
        mutationFn: (values) => resetUserPassword(userId, values),
        onSuccess: (user) => {
            onReset(user);
            setOpen(false);
            form.reset();
        }
    });
    const onSubmit = async (values) => {
        await mutation.mutateAsync(values);
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "secondary", children: t("users.reset") }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t("users.reset") }) }), _jsxs(Form, { form: form, onSubmit: onSubmit, submitLabel: mutation.isPending ? t("app.loading") : t("users.reset"), children: [_jsx(FormField, { label: _jsx(Label, { htmlFor: "temporary_password", children: t("auth.temporaryPassword") }), error: form.formState.errors.temporary_password, required: true, children: _jsx(Input, { id: "temporary_password", type: "password", ...form.register("temporary_password") }) }), _jsx(FormField, { label: _jsx(Label, { htmlFor: "must_change_password", children: t("auth.mustChange") }), children: _jsx("input", { id: "must_change_password", type: "checkbox", className: "h-4 w-4", checked: form.watch("must_change_password"), onChange: (event) => form.setValue("must_change_password", event.target.checked) }) })] })] })] }));
}
