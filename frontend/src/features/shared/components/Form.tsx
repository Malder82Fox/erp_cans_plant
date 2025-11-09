import { type ReactNode } from "react";
import { type FieldValues, type UseFormReturn } from "react-hook-form";
import { Button } from "../../../components/ui/button";

/* ---------- <Form> ---------- */
interface FormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  children: ReactNode;
  submitLabel?: string;
}

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  submitLabel = "Save",
}: FormProps<TFieldValues>): JSX.Element {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {children}
      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

/* ---------- <FormField> ---------- */
interface FormFieldProps {
  label: ReactNode;
  description?: ReactNode;
  /** Принимаем любой формат ошибки и нормализуем внутри */
  error?: unknown;
  required?: boolean;
  children: ReactNode;
}

function normalizeError(err: unknown): string {
  const raw = Array.isArray(err) ? err[0] : err;
  // react-hook-form: FieldError { message?: string }
  return (raw as any)?.message ?? "";
}

export function FormField({
  label,
  description,
  error,
  required = false,
  children,
}: FormFieldProps): JSX.Element {
  const msg = normalizeError(error);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive">*</span>}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      {children}
      {msg && <p className="text-xs text-destructive">{msg}</p>}
    </div>
  );
}
