import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { getBudgetsWithSpent, getUserCategories } from "../lib/data";
import { BudgetsClient } from "./BudgetsClient";
import type { BudgetWithCategory, Category } from "@/types";

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  let budgets: BudgetWithCategory[] = [];
  let categories: Category[] = [];
  let hasError = false;

  try {
    const [b, c] = await Promise.all([
      getBudgetsWithSpent(session.user.id),
      getUserCategories(session.user.id),
    ]);
    budgets = b;
    categories = c;
  } catch (error) {
    console.error("Budgets failed to load:", error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: "16px",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "rgba(255,107,71,0.1)",
            border: "1px solid rgba(255,107,71,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}
        >
          ⚠
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: "8px",
            }}
          >
            Something went wrong
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "24px",
            }}
          >
            We couldn&apos;t load your budgets. Please refresh the page.
          </p>
          <a
            href="/budgets"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 24px",
              borderRadius: "10px",
              background: "#e8ff47",
              color: "#080808",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Refresh Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <BudgetsClient
      budgets={budgets}
      categories={categories}
    />
  );
}