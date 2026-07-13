"use client";

import { CalendarDays } from "lucide-react";

import { useDateStore } from "@/store/date-store";

export function DateSelector() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);

  return (
    <label className="inline-flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <CalendarDays size={18} className="text-teal-700" aria-hidden="true" />
      <span className="font-medium text-slate-600">Board date</span>
      <input
        type="date"
        value={selectedDate}
        onChange={(event) => setSelectedDate(event.target.value)}
        className="rounded border border-slate-200 px-2 py-1 text-slate-950 outline-none focus:border-teal-600"
      />
    </label>
  );
}
