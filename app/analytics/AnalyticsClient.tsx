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

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  currency: string;
};

function CustomTooltip({ active, payload, label, currency }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
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
          {p.name}: {formatCurrency(Number(p.value), currency)}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsClient({ monthlyData, categorySpending }: Props) {
  const { currency } = useCurrency();

  const getCurrencySymbol = (curr: string): string => {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: curr,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? curr
    );
  };

  const currencySymbol = getCurrencySymbol(currency);

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
      {/* ── Summary Strip ─────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
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

      {/* ── Bar Chart ─────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          padding: "24px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
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
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            Income vs Expenses
          </p>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
            />
            <XAxis
              dataKey="month"
              tick={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000
                  ? `${currencySymbol}${v / 1000}k`
                  : `${currencySymbol}${v}`
              }
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  label={props.label}
                  payload={props.payload as ChartTooltipProps["payload"]}
                  currency={currency}
                />
              )}
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

      {/* ── Category Breakdown ────────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          padding: "24px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
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
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--text-primary)",
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
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {categorySpending.map((c) => {
              const total = categorySpending.reduce(
                (a, x) => a + x.value,
                0
              );
              const pct =
                total > 0
                  ? Math.round((c.value / total) * 100)
                  : 0;

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
                        minWidth: 0,
                      }}
                    >
                      <CategoryIcon
                        name={c.name}
                        color={c.color}
                        size="sm"
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
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
                        flexShrink: 0,
                        marginLeft: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(c.value, currency)}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          minWidth: "32px",
                          textAlign: "right",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
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

      {/* ── Monthly Net Savings ───────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          padding: "24px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
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
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            Net Savings
          </p>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {monthlyData.map((m) => {
            const savings = m.income - m.expense;
            const positive = savings >= 0;
            const maxAbs = Math.max(
              ...monthlyData.map((x) => Math.abs(x.income - x.expense)),
              1
            );
            const widthPct = Math.min(
              (Math.abs(savings) / maxAbs) * 100,
              100
            );

            return (
              <div
                key={m.month}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    minWidth: "36px",
                    flexShrink: 0,
                  }}
                >
                  {m.month}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "4px",
                    background: "rgba(255,255,255,0.07)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${widthPct}%`,
                      background: positive ? "#47ffe8" : "#ff6b47",
                      borderRadius: "2px",
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: positive ? "#47ffe8" : "#ff6b47",
                    minWidth: "80px",
                    textAlign: "right",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
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