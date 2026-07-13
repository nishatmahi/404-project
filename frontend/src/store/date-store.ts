"use client";

import { create } from "zustand";

const today = () => new Date().toISOString().slice(0, 10);

type DateState = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

export const useDateStore = create<DateState>((set) => ({
  selectedDate: today(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
