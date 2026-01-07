"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string; // yyyy-mm-dd
  onChange?: (val: string) => void;
  className?: string;
};

const parseLocalDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parts = value.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return undefined;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const initialDate = React.useMemo(() => {
    const d = parseLocalDate(value);
    return d && !isNaN(d.getTime()) ? d : undefined;
  }, [value]);

  const [date, setDate] = React.useState<Date | undefined>(initialDate);

  React.useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-[210px] justify-start text-left font-normal",
            className
          )}
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d ?? undefined);
            if (d && onChange) {
              onChange(format(d, "yyyy-MM-dd"));
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
