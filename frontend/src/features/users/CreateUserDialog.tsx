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
import { createUser, type User, type UserRole } from "../../lib/apiClient";
import { Form, FormField } from "../shared/components/Form";

const schema = z.object({
  username: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8),
  role: z.custom<UserRole>(),
  must_change_password: z.boolean().default(true)
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onCreated: (user: User) => void;
}

export function CreateUserDialog({ onCreated }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "admin" as UserRole,
      must_change_password: true
    }
  });
  form.register("role");
  form.register("must_change_password");

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createUser({
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

  const onSubmit = async (values: FormValues) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("users.create")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.create")}</DialogTitle>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} submitLabel={mutation.isPending ? t("app.loading") : t("users.create")}>
          <FormField label={<Label htmlFor="username">{t("auth.username")}</Label>} error={form.formState.errors.username} required>
            <Input id="username" {...form.register("username")} />
          </FormField>
          <FormField label={<Label htmlFor="email">{t("users.email")}</Label>} error={form.formState.errors.email}>
            <Input id="email" type="email" {...form.register("email")} />
          </FormField>
          <FormField label={<Label htmlFor="password">{t("auth.temporaryPassword")}</Label>} error={form.formState.errors.password} required>
            <Input id="password" type="password" {...form.register("password")} />
          </FormField>
          <FormField label={<Label htmlFor="role">{t("users.role")}</Label>} error={form.formState.errors.role}>
            <Select id="role" value={form.watch("role")} onChange={(event) => form.setValue("role", event.target.value as UserRole)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="root">Root</option>
            </Select>
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
