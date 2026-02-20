"use client";

import { useTimeFormat } from "@/components/time-format-provider";

type TimeStampProps = {
  value: string | Date | null | undefined;
  showDate?: boolean;
  className?: string;
};

type ParsedTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  hasTime: boolean;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseValue(value: string | Date): ParsedTime | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hour: value.getHours(),
      minute: value.getMinutes(),
      second: value.getSeconds(),
      hasTime: true
    };
  }

  const input = value.trim();
  if (!input) {
    return null;
  }

  const directMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
  if (directMatch) {
    return {
      year: Number(directMatch[1]),
      month: Number(directMatch[2]),
      day: Number(directMatch[3]),
      hour: Number(directMatch[4] ?? 0),
      minute: Number(directMatch[5] ?? 0),
      second: Number(directMatch[6] ?? 0),
      hasTime: Boolean(directMatch[4])
    };
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
    hour: parsed.getHours(),
    minute: parsed.getMinutes(),
    second: parsed.getSeconds(),
    hasTime: true
  };
}

function formatTime(parsed: ParsedTime, timeFormat: "12h" | "24h"): string {
  if (timeFormat === "24h") {
    return `${pad2(parsed.hour)}:${pad2(parsed.minute)}:${pad2(parsed.second)}`;
  }

  const isPm = parsed.hour >= 12;
  const hour12 = parsed.hour % 12 || 12;
  const suffix = isPm ? "PM" : "AM";
  return `${pad2(hour12)}:${pad2(parsed.minute)}:${pad2(parsed.second)} ${suffix}`;
}

export default function TimeStamp({ value, showDate = true, className }: TimeStampProps) {
  const { timeFormat, toggleTimeFormat } = useTimeFormat();

  if (value === null || value === undefined) {
    return <span className={className}>N/A</span>;
  }

  const raw = value instanceof Date ? value.toISOString() : String(value);
  const parsed = parseValue(value);
  if (!parsed) {
    return <span className={className}>{raw || "N/A"}</span>;
  }

  const datePart = `${parsed.year}-${pad2(parsed.month)}-${pad2(parsed.day)}`;
  const text = parsed.hasTime
    ? showDate
      ? `${datePart} ${formatTime(parsed, timeFormat)}`
      : formatTime(parsed, timeFormat)
    : datePart;

  if (!parsed.hasTime) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Click to toggle 12h/24h"
      onClick={toggleTimeFormat}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleTimeFormat();
        }
      }}
      className={`${className ?? ""} cursor-pointer transition hover:underline decoration-dotted`}
    >
      {text}
    </span>
  );
}
