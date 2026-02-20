"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type TimeFormat = "12h" | "24h";

type TimeFormatContextValue = {
  timeFormat: TimeFormat;
  toggleTimeFormat: () => void;
};

const STORAGE_KEY = "timeFormat";
const TimeFormatContext = createContext<TimeFormatContextValue | null>(null);

export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "12h" || stored === "24h") {
      setTimeFormat(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, timeFormat);
  }, [timeFormat]);

  const toggleTimeFormat = useCallback(() => {
    setTimeFormat((current) => (current === "12h" ? "24h" : "12h"));
  }, []);

  const value = useMemo(
    () => ({
      timeFormat,
      toggleTimeFormat
    }),
    [timeFormat, toggleTimeFormat]
  );

  return <TimeFormatContext.Provider value={value}>{children}</TimeFormatContext.Provider>;
}

export function useTimeFormat(): TimeFormatContextValue {
  const context = useContext(TimeFormatContext);
  if (!context) {
    throw new Error("useTimeFormat must be used within TimeFormatProvider");
  }
  return context;
}
