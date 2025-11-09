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
import { resetUserPassword, type User } from "../../lib/apiClient";
import { Form, FormField } from "../shared/components/Form";

const schema = z.object({
  temporary_password: z.string().min(8),
  must_change_password: z.boolean().default(true)
});

type FormValues = z.infer<typeof schema>;

interface Props {
  userId: number;
  onReset: (user: User) => void;
}

export function ResetPasswordDialog({ userId, onReset }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      temporary_password: "",
      must_change_password: true
    }
  });
  form.register("must_change_password");

  const mutation = useMutation({
    mutationFn: (values: FormValues) => resetUserPassword(userId, values),
    onSuccess: (user) => {
      onReset(user);
      setOpen(false);
      form.reset();
    }
  });

  const onSubmit = async (values: FormValues) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">{t("users.reset")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.reset")}</DialogTitle>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} submitLabel={mutation.isPending ? t("app.loading") : t("users.reset")}>
          <FormField label={<Label htmlFor="temporary_password">{t("auth.temporaryPassword")}</Label>} error={form.formState.errors.temporary_password} required>
            <Input id="temporary_password" type="password" {...form.register("temporary_password")} />
          </FormField>
          <FormField label={<Label htmlFor="must_change_password">{t("auth.mustChange")}</Label>}>
            <input
              id="must_change_password"
              type="checkbox"
              className="h-4 w-4"
              checked={form.watch("must_change_password")}
              onChange={(event) => form.setValue("must_change_password", event.target.checked)}
            />
          </FormField>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
