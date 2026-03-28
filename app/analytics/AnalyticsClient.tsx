"use client";

import { useCurrency } from "../components/layout/CurrencyProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../lib/utils";
import type { MonthlyData, CategorySpending } from "@/types";
import { CategoryIcon } from "../components/ui/CategoryIcon"; 

type Props = {
  monthlyData: MonthlyData[];
  categorySpending: CategorySpending[];
};

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
          fontFamily: "var(--font-mono)",
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
            fontFamily: "var(--font-mono)",
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

export function AnalyticsClient({ monthlyData, categorySpending }: Props) {
  const { currency } = useCurrency();
  const totalIncome = monthlyData.reduce((a, m) => a + m.income, 0);
  const totalExpense = monthlyData.reduce((a, m) => a + m.expense, 0);
  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  return (
    <div
      className="animate-fade-up"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* ── Summary Strip ───────────────────────────────────────────── */}
   <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "20px",
  }}
>
  {[
    {
      label: "6-Month Income",
      value: formatCurrency(totalIncome, currency),
      color: "#e8ff47",
    },
    {
      label: "6-Month Expenses",
      value: formatCurrency(totalExpense, currency),
      color: "#4778ff",
    },
    {
      label: "Avg Savings Rate",
      value: `${savingsRate}%`,
      color: "#47ffe8",
    },
  ].map((s) => (
    <div
      key={s.label}
      style={{
        borderRadius: "14px",
        padding: "14px 12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "8px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {s.label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(14px, 2.5vw, 22px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: s.color,
          wordBreak: "break-word",
          lineHeight: 1.1,
        }}
      >
        {s.value}
      </p>
    </div>
  ))}
</div>
        

      {/* ── Bar Chart ───────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          padding: "28px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            Monthly
          </p>
          <p
            style={{
              fontFamily: "(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
            }}
          >
            Income vs Expenses
          </p>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="month"
              tick={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fill: "rgba(255,255,255,0.3)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fill: "rgba(255,255,255,0.3)",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="#e8ff47"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="Expense"
              fill="#4778ff"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "16px",
            justifyContent: "center",
          }}
        >
          {[
            { label: "Income",  color: "#e8ff47" },
            { label: "Expense", color: "#4778ff" },
          ].map((l) => (
            <div
              key={l.label}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "3px",
                  background: l.color,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category Breakdown ───────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          padding: "28px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            This Month
          </p>
          <p
            style={{
              fontFamily: "(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
            }}
          >
            Top Spending Categories
          </p>
        </div>

        {categorySpending.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No expense data this month
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {categorySpending.map((c) => {
              const total = categorySpending.reduce(
                (a, x) => a + x.value,
                0
              );
              const pct =
                total > 0 ? Math.round((c.value / total) * 100) : 0;

              return (
                <div key={c.name}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
 <CategoryIcon
  name={c.name}
  color={c.color}
  size="sm"
/>
                     
                      <span
                        style={{
                          fontFamily: "(--font-display)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {c.name}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {formatCurrency(c.value, currency)}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          minWidth: "36px",
                          textAlign: "right",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
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
                        background: c.color,
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Monthly Savings ──────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          padding: "28px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            Per Month
          </p>
          <p
            style={{
              fontFamily: "(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
            }}
          >
            Net Savings
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {monthlyData.map((m) => {
            const savings = m.income - m.expense;
            const positive = savings >= 0;

            return (
              <div
                key={m.month}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    minWidth: "40px",
                  }}
                >
                  {m.month}
                </span>
                <div
                  style={{
                    flex: 1,
                    margin: "0 16px",
                    height: "4px",
                    background: "rgba(255,255,255,0.07)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(Math.abs(savings) / Math.max(...monthlyData.map((x) => Math.abs(x.income - x.expense)), 1) * 100, 100)}%`,
                      background: positive ? "#47ffe8" : "#ff6b47",
                      borderRadius: "2px",
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: positive ? "#47ffe8" : "#ff6b47",
                    minWidth: "90px",
                    textAlign: "right",
                  }}
                >
                  {positive ? "+" : ""}
                  {formatCurrency(savings, currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}