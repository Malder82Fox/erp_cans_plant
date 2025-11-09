import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../lib/auth";
import { changePassword } from "../../lib/apiClient";
const schema = z
    .object({
    old_password: z.string().min(6),
    new_password: z.string().min(8)
})
    .refine((values) => values.old_password !== values.new_password, {
    message: "New password must be different",
    path: ["new_password"]
});
export function ChangePasswordPage() {
    const { t } = useTranslation();
    const { state: { passwordChangeRequired }, markPasswordChanged, refreshProfile } = useAuth();
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { old_password: "", new_password: "" }
    });
    const mutation = useMutation({
        mutationFn: (values) => changePassword(values),
        onSuccess: async () => {
            markPasswordChanged();
            await refreshProfile();
        }
    });
    if (!passwordChangeRequired) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    const onSubmit = async (values) => {
        try {
            await mutation.mutateAsync(values);
        }
        catch (error) {
            console.error(error);
            form.setError("new_password", { message: t("errors.network") });
        }
    };
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-muted", children: _jsxs(Card, { className: "w-full max-w-lg", children: [_jsxs(CardHeader, { children: [_jsx("h1", { className: "text-2xl font-semibold", children: t("auth.changePassword") }), _jsx("p", { className: "text-sm text-muted-foreground", children: t("auth.passwordChangeRequired") })] }), _jsx(CardContent, { children: _jsxs("form", { className: "space-y-4", onSubmit: form.handleSubmit(onSubmit), children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "old_password", children: t("auth.oldPassword") }), _jsx(Input, { id: "old_password", type: "password", ...form.register("old_password") }), form.formState.errors.old_password && (_jsx("p", { className: "text-xs text-destructive", children: form.formState.errors.old_password.message }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "new_password", children: t("auth.newPassword") }), _jsx(Input, { id: "new_password", type: "password", ...form.register("new_password") }), form.formState.errors.new_password && (_jsx("p", { className: "text-xs text-destructive", children: form.formState.errors.new_password.message }))] }), _jsx(Button, { type: "submit", className: "w-full", disabled: mutation.isPending, children: mutation.isPending ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : t("auth.confirm") })] }) })] }) }));
}
