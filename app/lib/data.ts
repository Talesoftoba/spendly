import { prisma } from "./prisma";
import { getMonthRange, getPercentageChange } from "./utils";
import type {
  DashboardStats,
  MonthlyData,
  CategorySpending,
  BudgetWithCategory,
} from "@/types";

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const current = getMonthRange(0);
  const previous = getMonthRange(1);

  const [currentTxns, previousTxns, allTxns] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: current.start, lte: current.end } },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: previous.start, lte: previous.end } },
    }),
    prisma.transaction.findMany({
      where: { userId },
    }),
  ]);

  const sum = (txns: typeof currentTxns, type: "INCOME" | "EXPENSE") =>
    txns
      .filter((t) => t.type === type)
      .reduce((acc, t) => acc + t.amount, 0);

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
  const months = Array.from({ length: 6 }, (_, i) => getMonthRange(5 - i));

  const data = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const txns = await prisma.transaction.findMany({
        where: { userId, date: { gte: start, lte: end } },
      });

      const income = txns
        .filter((t) => t.type === "INCOME")
        .reduce((a, t) => a + t.amount, 0);

      const expense = txns
        .filter((t) => t.type === "EXPENSE")
        .reduce((a, t) => a + t.amount, 0);

      return { month: label, income, expense };
    })
  );

  return data;
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

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      return { ...budget, spent: spent._sum.amount ?? 0 };
    })
  );

  return budgetsWithSpent;
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