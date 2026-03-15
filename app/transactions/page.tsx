import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { getTransactions, getUserCategories } from "../lib/data";
import { TransactionsClient } from "./TransactionsClient";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [transactions, categories] = await Promise.all([
    getTransactions(session.user.id),
    getUserCategories(session.user.id),
  ]);

  return (
    <TransactionsClient
      transactions={transactions}
      categories={categories}
    />
  );
}