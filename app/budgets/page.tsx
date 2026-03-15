import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { getBudgetsWithSpent, getUserCategories } from "../lib/data";
import { BudgetsClient } from "./BudgetsClient";

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [budgets, categories] = await Promise.all([
    getBudgetsWithSpent(session.user.id),
    getUserCategories(session.user.id),
  ]);

  return (
    <BudgetsClient
      budgets={budgets}
      categories={categories}
    />
  );
}