import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { getUserCategories } from "../lib/data";
import { prisma } from "../lib/prisma";
import { SettingsClient } from "./SettingsClient";
import type { Category } from "@/types";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  let categories: Category[] = [];
  let user: { currency: string; name: string | null } | null = null;
  let hasError = false;

  try {
    const [cats, u] = await Promise.all([
      getUserCategories(session.user.id),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true, name: true },
      }),
    ]);
    categories = cats;
    user = u;
  } catch (error) {
    console.error("Settings failed to load:", error);
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
            We couldn&apos;t load your settings. Please refresh the page.
          </p>
          <a
            href="/settings"
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
    <SettingsClient
      categories={categories}
      savedName={user?.name ?? ""}
      savedCurrency={user?.currency ?? "USD"}
    />
  );
}