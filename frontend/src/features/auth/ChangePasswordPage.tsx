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

type FormValues = z.infer<typeof schema>;

export function ChangePasswordPage(): JSX.Element {
  const { t } = useTranslation();
  const {
    state: { passwordChangeRequired },
    markPasswordChanged,
    refreshProfile
  } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { old_password: "", new_password: "" }
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => changePassword(values),
    onSuccess: async () => {
      markPasswordChanged();
      await refreshProfile();
    }
  });

  if (!passwordChangeRequired) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      console.error(error);
      form.setError("new_password", { message: t("errors.network") });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h1 className="text-2xl font-semibold">{t("auth.changePassword")}</h1>
          <p className="text-sm text-muted-foreground">{t("auth.passwordChangeRequired")}</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="old_password">{t("auth.oldPassword")}</Label>
              <Input id="old_password" type="password" {...form.register("old_password")} />
              {form.formState.errors.old_password && (
                <p className="text-xs text-destructive">{form.formState.errors.old_password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">{t("auth.newPassword")}</Label>
              <Input id="new_password" type="password" {...form.register("new_password")} />
              {form.formState.errors.new_password && (
                <p className="text-xs text-destructive">{form.formState.errors.new_password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.confirm")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
