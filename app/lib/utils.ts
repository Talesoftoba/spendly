//Helper functions

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy");
}

export function getMonthRange(monthsAgo = 0) {
  const date = subMonths(new Date(), monthsAgo);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
    label: format(date, "MMM"),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function getPercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}