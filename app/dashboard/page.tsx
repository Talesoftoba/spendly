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

  // 1️⃣ Fetch stats first (already optimized)
  const stats = await getDashboardStats(userId);

  // 2️⃣ Fetch monthly data and category spending in parallel (only 2 queries)
  const [monthlyData, categorySpending] = await Promise.all([
    getMonthlyData(userId),
    getCategorySpending(userId),
  ]);

  // 3️⃣ Fetch budgets and recent transactions sequentially
  const budgets = await getBudgetsWithSpent(userId);
  const recentTransactions = await getRecentTransactions(userId, 6);

  // Return the dashboard client
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