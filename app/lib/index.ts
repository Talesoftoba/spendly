//shared Typescript types

import {
  Transaction,
  Budget,
  Category,
  User,
  TransactionType,
} from "@prisma/client";

export type { Transaction, Budget, Category, User, TransactionType };

export type TransactionWithCategory = Transaction & {
  category: Category | null;
};

export type BudgetWithCategory = Budget & {
  category: Category;
  spent: number;
};

export type DashboardStats = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  incomeChange: number;
  expenseChange: number;
};

export type MonthlyData = {
  month: string;
  income: number;
  expense: number;
};

export type CategorySpending = {
  name: string;
  value: number;
  color: string;
  icon: string;
};

export type BudgetAlert = {
  id: string;
  categoryName: string;
  spent: number;
  limit: number;
  overBy: number;
};
