import { prisma } from "./prisma";
import { getMonthRange, getPercentageChange } from "./utils";
import type {
  DashboardStats,
  MonthlyData,
  CategorySpending,
  BudgetWithCategory,
} from "@/types";
import { startOfMonth, subMonths } from "date-fns";

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const current = getMonthRange(0);
  const previous = getMonthRange(1);

  //  ONLY ONE QUERY
  const allTxns = await prisma.transaction.findMany({
    where: { userId },
  });

  // helper
  const sum = (txns: typeof allTxns, type: "INCOME" | "EXPENSE") =>
    txns
      .filter((t) => t.type === type)
      .reduce((acc, t) => acc + t.amount, 0);

  // filter in JS instead of DB
  const currentTxns = allTxns.filter(
    (t) => t.date >= current.start && t.date <= current.end
  );

  const previousTxns = allTxns.filter(
    (t) => t.date >= previous.start && t.date <= previous.end
  );

  const monthlyIncome = sum(currentTxns, "INCOME");
  const monthlyExpenses = sum(currentTxns, "EXPENSE");
  const prevIncome = sum(previousTxns, "INCOME");
  const prevExpenses = sum(previousTxns, "EXPENSE");
  const totalBalance = sum(allTxns, "INCOME") - sum(allTxns, "EXPENSE");

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    netSavings: monthlyIncome - monthlyExpenses,
    incomeChange: getPercentageChange(monthlyIncome, prevIncome),
    expenseChange: getPercentageChange(monthlyExpenses, prevExpenses),
  };
}

// ─── Monthly Chart Data (last 6 months) ───────────────────────────────────────

export async function getMonthlyData(userId: string): Promise<MonthlyData[]> {
  // Get the start of 6 months ago
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  // Single query for all transactions in the last 6 months
  const txns = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
  });

  // Build month buckets
  const months = Array.from({ length: 6 }, (_, i) => getMonthRange(5 - i));

  return months.map(({ start, end, label }) => {
    const monthTxns = txns.filter(
      (t) => t.date >= start && t.date <= end
    );
    const income = monthTxns
      .filter((t) => t.type === "INCOME")
      .reduce((a, t) => a + t.amount, 0);
    const expense = monthTxns
      .filter((t) => t.type === "EXPENSE")
      .reduce((a, t) => a + t.amount, 0);
    return { month: label, income, expense };
  });
}

// ─── Category Spending (current month) ────────────────────────────────────────

export async function getCategorySpending(
  userId: string
): Promise<CategorySpending[]> {
  const { start, end } = getMonthRange(0);

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: start, lte: end },
      categoryId: { not: null },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const categories = await prisma.category.findMany({
    where: { userId },
  });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return grouped
    .filter((g) => g.categoryId && catMap[g.categoryId])
    .map((g) => ({
      name: catMap[g.categoryId!].name,
      value: g._sum.amount ?? 0,
      color: catMap[g.categoryId!].color,
      icon: catMap[g.categoryId!].icon,
    }));
}

// ─── Budgets with Spent Amount ─────────────────────────────────────────────────

export async function getBudgetsWithSpent(
  userId: string
): Promise<BudgetWithCategory[]> {
  const { start, end, month, year } = getMonthRange(0);

  // Get budgets and all this month's expenses in parallel — just 2 queries
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: start, lte: end },
        categoryId: { not: null },
      },
      select: { categoryId: true, amount: true },
    }),
  ]);

  // Group expenses by categoryId in JavaScript
  const spentByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    if (e.categoryId) {
      spentByCategory[e.categoryId] =
        (spentByCategory[e.categoryId] ?? 0) + e.amount;
    }
  });

  // Attach spent amount to each budget
  return budgets.map((budget) => ({
    ...budget,
    spent: spentByCategory[budget.categoryId] ?? 0,
  }));
}

// ─── Recent Transactions ───────────────────────────────────────────────────────

export async function getRecentTransactions(userId: string, limit = 6) {
  return prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}

// ─── All Transactions with Filters ────────────────────────────────────────────

export async function getTransactions(
  userId: string,
  filters: {
    search?: string;
    type?: string;
    categoryId?: string;
  } = {}
) {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(filters.type && filters.type !== "ALL"
        ? { type: filters.type as "INCOME" | "EXPENSE" }
        : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.search
        ? { title: { contains: filters.search, mode: "insensitive" } }
        : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

// ─── Over Budget Alerts (used by SSE) ─────────────────────────────────────────

export async function getOverBudgetAlerts(userId: string) {
  const budgets = await getBudgetsWithSpent(userId);
  return budgets.filter((b) => b.spent > b.limit);
}

// ─── User Categories ───────────────────────────────────────────────────────────

export async function getUserCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}