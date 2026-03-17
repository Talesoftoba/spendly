"use client";

import { createContext, useContext, useState } from "react";

type CurrencyContextType = {
  currency: string;
  setCurrency: (currency: string) => void;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
});

export function CurrencyProvider({
  children,
  initialCurrency = "USD",
}: {
  children: React.ReactNode;
  initialCurrency?: string;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}