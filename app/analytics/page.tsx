import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { getMonthlyData, getCategorySpending } from "../lib/data";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [monthlyData, categorySpending] = await Promise.all([
    getMonthlyData(session.user.id),
    getCategorySpending(session.user.id),
  ]);

  return (
    <AnalyticsClient
      monthlyData={monthlyData}
      categorySpending={categorySpending}
    />
  );
}