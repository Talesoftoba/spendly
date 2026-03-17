"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { CurrencyProvider } from "./CurrencyProvider";

export function Providers({
  children,
  currency = "USD",
}: {
  children: React.ReactNode;
  currency?: string;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CurrencyProvider initialCurrency={currency}>
          {children}
        </CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}