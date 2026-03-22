import {
  Home,
  ShoppingCart,
  Car,
  ShoppingBag,
  Zap,
  Tv,
  Briefcase,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  Housing: Home,
  Food: ShoppingCart,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Zap,
  Entertainment: Tv,
  Income: Briefcase,
};

export const categoryColors: Record<string, string> = {
  Housing: "#e8ff47",
  Food: "#47ffe8",
  Transport: "#ff6b47",
  Shopping: "#a847ff",
  Bills: "#4778ff",
  Entertainment: "#ff47a8",
  Income: "#47ff78",
};
export { CreditCard as fallbackIcon };