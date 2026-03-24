"use client";

import { useCurrency } from "../components/layout/CurrencyProvider";

import Link from "next/link";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { formatCurrency, formatDate } from "../lib/utils"; 
import type {
  DashboardStats,
  MonthlyData,
  CategorySpending,
  BudgetWithCategory,
  TransactionWithCategory,
} from "@/types";
import { categoryIcons, categoryColors, } from "../lib/categoryConfig";
import { CreditCard } from "lucide-react";
import { CategoryIcon } from "../components/ui/CategoryIcon"; 

type Props = {
  stats: DashboardStats;
  monthlyData: MonthlyData[];
  categorySpending: CategorySpending[];
  budgets: BudgetWithCategory[];
  recentTransactions: TransactionWithCategory[];
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

type TooltipEntry = {
  name: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "12px 16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-mono)",
          fontSize: "11px",
          color: "var(--text-muted)",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "12px",
            color: p.color,
          }}
        >
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  accent: string;
  positive?: boolean;
};

function StatCard({ label, value, sub, accent, positive }: StatCardProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        padding: "24px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        transition: "border-color 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Accent glow in top right corner */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "80px",
          height: "80px",
          background: `radial-gradient(circle at top right, ${accent}33, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-dm-mono)",
          fontSize: "11px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "12px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-syne)",
          fontSize: "28px",
          fontWeight: 700,
          color: "#fff",
          marginBottom: "6px",
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "var(--font-dm-mono)",
          fontSize: "12px",
          color: positive === false ? "#ff6b47" : accent,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardClient({
  stats,
  monthlyData,
  categorySpending,
  budgets,
  recentTransactions,
}: Props) {
  const { currency } = useCurrency();
  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        <StatCard
          label="Total Balance"
          value={formatCurrency(stats.totalBalance, currency)}
          sub="Net all-time savings"
          accent="#e8ff47"
        />
        <StatCard
          label="Monthly Income"
          value={formatCurrency(stats.monthlyIncome, currency)}
          sub={`${stats.incomeChange >= 0 ? "↑" : "↓"} ${Math.abs(stats.incomeChange)}% vs last month`}
          accent="#47ffe8"
          positive={stats.incomeChange >= 0}
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(stats.monthlyExpenses, currency)}
          sub={`${stats.expenseChange <= 0 ? "↓" : "↑"} ${Math.abs(stats.expenseChange)}% vs last month`}
          accent="#4778ff"
          positive={stats.expenseChange <= 0}
        />
        <StatCard
          label="Net Savings"
          value={formatCurrency(stats.netSavings, currency)}
          sub={stats.netSavings >= 0 ? "↑ On track" : "↓ Overspending"}
          accent="#a847ff"
          positive={stats.netSavings >= 0}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "16px",
        }}
      >
        {/* Cash Flow Area Chart */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "4px",
                }}
              >
                Cash Flow
              </p>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                }}
              >
                Last 6 Months
              </p>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                { label: "Income",  color: "#e8ff47" },
                { label: "Expense", color: "#4778ff" },
              ].map((l) => (
                <div
                  key={l.label}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "2px",
                      background: l.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e8ff47" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e8ff47" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4778ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4778ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="month"
                tick={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: 11,
                  fill: "rgba(255,255,255,0.3)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: 11,
                  fill: "rgba(255,255,255,0.3)",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#e8ff47"
                strokeWidth={2}
                fill="url(#incomeGrad)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#4778ff"
                strokeWidth={2}
                fill="url(#expenseGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Donut Chart */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            Spending by
          </p>
          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "20px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              marginBottom: "16px",
            }}
          >
            Category
          </p>

          {categorySpending.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "13px",
                color: "var(--text-muted)",
                textAlign: "center",
                paddingTop: "40px",
              }}
            >
              No expenses this month
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categorySpending.map((entry) => ({
                      ...entry,
                      fill: entry.color,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v as number), ""]}
                    contentStyle={{
                      background: "#0f0f0f",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                {categorySpending.slice(0, 6).map((c) => (
                  <div
                    key={c.name}
                    style={{ display: "flex", alignItems: "center", gap: "7px" }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        background: c.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "16px",
        }}
      >
        {/* Recent Transactions */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "15px",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              Recent Transactions
            </p>
            <Link
              href="/transactions"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              View all →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {recentTransactions.length === 0 && (
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                No transactions yet
              </p>
            )}
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px",
                  borderRadius: "10px",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255,255,255,0.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
   
<CategoryIcon
  name={t.category?.name ?? ""}
  color={t.category?.color}
  size="md"
/>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#fff",
                      marginBottom: "2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t.category?.name ?? "Uncategorized"} · {formatDate(t.date)}
                  </p>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: t.type === "INCOME" ? "#47ffe8" : "rgba(255,255,255,0.7)",
                    flexShrink: 0,
                  }}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Status */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "15px",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              Budget Status
            </p>
            <Link
              href="/budgets"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              Manage →
            </Link>
          </div>

          {budgets.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "13px",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              No budgets set yet
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {budgets.map((b) => {
                const pct = Math.min((b.spent / b.limit) * 100, 100);
                const over = b.spent > b.limit;
                return (
                  <div key={b.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >

<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  {(() => {
    const Icon = categoryIcons[b.category.name] ?? CreditCard;
    const color = categoryColors[b.category.name] ?? "rgba(255,255,255,0.4)";
    return (
      <span
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={12} color={color} strokeWidth={2} />
      </span>
    );
  })()}
  <span
    style={{
      fontFamily: "var(--font-syne)",
      fontSize: "13px",
      fontWeight: 600,
      color: "var(--text-primary)",
    }}
  >
    {b.category.name}
  </span>
</div>

                      
                      <span
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "12px",
                          color: over ? "#ff6b47" : "var(--text-muted)",
                        }}
                      >
                        {formatCurrency(b.spent, currency)} / {formatCurrency(b.limit, currency)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: "3px",
                          background: over ? "#ff6b47" : b.category.color,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                    {over && (
                      <p
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "10px",
                          color: "#ff6b47",
                          marginTop: "4px",
                        }}
                      >
                        ⚠ Over by {formatCurrency(b.spent - b.limit, currency)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}