import { format } from "date-fns";
import { useMemo } from "react";

import { Input } from "../../../components/ui/input";

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps): JSX.Element {
  const formatted = useMemo(() => {
    const from = value.from ? format(new Date(value.from), "yyyy-MM-dd") : "";
    const to = value.to ? format(new Date(value.to), "yyyy-MM-dd") : "";
    return { from, to };
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={formatted.from}
        onChange={(event) => onChange({ ...value, from: event.target.value || null })}
      />
      <span className="text-sm text-muted-foreground">–</span>
      <Input type="date" value={formatted.to} onChange={(event) => onChange({ ...value, to: event.target.value || null })} />
    </div>
  );
}
