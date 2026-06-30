"use client";

import TimePicker from "react-time-picker";
import type { ComponentProps } from "react";

import { normalizeTime24 } from "@/hooks/use-time-24";

type TimePickerValue = ComponentProps<typeof TimePicker>["value"];

type Time24PickerProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  minTime?: string;
  maxTime?: string;
  error?: string | boolean | null;
  className?: string;
  allowClear?: boolean;
  placeholder?: string;
  id?: string;
};

export function Time24Picker({
  value,
  onChange,
  disabled,
  required,
  name,
  minTime,
  maxTime,
  error,
  className = "",
  allowClear = false,
  placeholder,
  id,
}: Time24PickerProps) {
  const normalizedValue = value ? normalizeTime24(value) : "";

  return (
    <TimePicker
      id={id}
      name={name}
      value={normalizedValue as TimePickerValue}
      onChange={(nextValue) => {
        const next = typeof nextValue === "string" ? nextValue : "";
        onChange(next ? normalizeTime24(next) : "");
      }}
      disabled={disabled}
      required={required}
      minTime={minTime}
      maxTime={maxTime}
      format="HH:mm"
      disableClock
      clockIcon={null}
      clearIcon={allowClear ? undefined : null}
      hourPlaceholder="HH"
      minutePlaceholder="MM"
      className={`time-24-picker ${className}`}
      aria-invalid={Boolean(error) || undefined}
      aria-label={placeholder || name || "Time"}
    />
  );
}
