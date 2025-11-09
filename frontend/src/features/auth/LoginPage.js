import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../lib/auth";
const schema = z.object({
    username: z.string().min(1),
    password: z.string().min(1)
});
export function LoginPage() {
    const { t } = useTranslation();
    const location = useLocation();
    const { state: { accessToken } } = useAuth();
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { username: "", password: "" }
    });
    const { login } = useAuth();
    const mutation = useMutation({
        mutationFn: ({ username, password }) => login(username, password)
    });
    if (accessToken) {
        const from = location.state?.from?.pathname ?? "/";
        return _jsx(Navigate, { to: from, replace: true });
    }
    const onSubmit = async (values) => {
        try {
            await mutation.mutateAsync(values);
        }
        catch (error) {
            console.error(error);
            form.setError("password", { message: t("errors.network") });
        }
    };
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-muted", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { children: [_jsx("h1", { className: "text-2xl font-semibold", children: t("auth.loginTitle") }), _jsx("p", { className: "text-sm text-muted-foreground", children: "ERP" })] }), _jsx(CardContent, { children: _jsxs("form", { className: "space-y-4", onSubmit: form.handleSubmit(onSubmit), children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "username", children: t("auth.username") }), _jsx(Input, { id: "username", ...form.register("username"), autoComplete: "username" }), form.formState.errors.username && (_jsx("p", { className: "text-xs text-destructive", children: form.formState.errors.username.message }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: t("auth.password") }), _jsx(Input, { id: "password", type: "password", autoComplete: "current-password", ...form.register("password") }), form.formState.errors.password && (_jsx("p", { className: "text-xs text-destructive", children: form.formState.errors.password.message }))] }), _jsx(Button, { type: "submit", className: "w-full", disabled: mutation.isPending, children: mutation.isPending ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : t("auth.submit") })] }) })] }) }));
}
