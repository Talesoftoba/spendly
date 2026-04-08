import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { getMonthlyData, getCategorySpending } from "../lib/data";
import { AnalyticsClient } from "./AnalyticsClient";
import type { MonthlyData, CategorySpending } from "@/types";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  let monthlyData: MonthlyData[] = [];
  let categorySpending: CategorySpending[] = [];
  let hasError = false;

  try {
    const [monthly, category] = await Promise.all([
      getMonthlyData(session.user.id),
      getCategorySpending(session.user.id),
    ]);
    monthlyData = monthly;
    categorySpending = category;
  } catch (error) {
    console.error("Analytics failed to load:", error);
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
            We couldn&apos;t load your analytics. Please refresh the page.
          </p>
          <a
            href="/analytics"
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
    <AnalyticsClient
      monthlyData={monthlyData}
      categorySpending={categorySpending}
    />
  );
}