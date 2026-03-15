import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import {
  getDashboardStats,
  getMonthlyData,
  getCategorySpending,
  getBudgetsWithSpent,
  getRecentTransactions,
} from "../lib/data";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;

  // All queries run at the same time — not one after another
  const [stats, monthlyData, categorySpending, budgets, recentTransactions] =
    await Promise.all([
      getDashboardStats(userId),
      getMonthlyData(userId),
      getCategorySpending(userId),
      getBudgetsWithSpent(userId),
      getRecentTransactions(userId, 6),
    ]);

  return (
    <DashboardClient
      stats={stats}
      monthlyData={monthlyData}
      categorySpending={categorySpending}
      budgets={budgets}
      recentTransactions={recentTransactions}
    />
  );
}