import { type ReactNode } from "react";
import { type FieldError, type FieldValues, type UseFormReturn } from "react-hook-form";

import { Button } from "../../../components/ui/button";

interface FormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  children: ReactNode;
  submitLabel?: string;
}

export function Form<TFieldValues extends FieldValues>({ form, onSubmit, children, submitLabel = "Save" }: FormProps<TFieldValues>): JSX.Element {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {children}
      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: ReactNode;
  description?: ReactNode;
  error?: FieldError | FieldError[] | undefined;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, description, error, required = false, children }: FormFieldProps): JSX.Element {
  const normalizedError = Array.isArray(error) ? error[0] : error;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive">*</span>}
        </div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      {children}
      {normalizedError && <p className="text-xs text-destructive">{normalizedError.message}</p>}
    </div>
  );
}
