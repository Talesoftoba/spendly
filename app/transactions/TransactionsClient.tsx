"use client";

import { useState, useTransition } from "react";
import { Search, Plus, Trash2, X } from "lucide-react";
import { createTransaction, deleteTransaction } from "../lib/actions";
import { formatCurrency, formatDate } from "../lib/utils";
import { useCurrency } from "../components/layout/CurrencyProvider";
import type { TransactionWithCategory, Category } from "@/types";
import { CategoryIcon } from "../components/ui/CategoryIcon"; 

type Props = {
  transactions: TransactionWithCategory[];
  categories: Category[];
};

type FilterType = "ALL" | "INCOME" | "EXPENSE";

export function TransactionsClient({
  transactions: initial,
  categories,
}: Props) {
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [formError, setFormError] = useState("");

  const filtered = transactions.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || t.type === filter;
    return matchSearch && matchFilter;
  });

  const handleAdd = () => {
    if (!form.title || !form.amount) {
      setFormError("Title and amount are required");
      return;
    }
    setFormError("");

    startTransition(async () => {
      const result = await createTransaction({
        ...form,
        amount: parseFloat(form.amount),
      });

      if ("error" in result) {
        setFormError("Something went wrong. Please try again.");
        return;
      }

      setShowModal(false);
      setForm({
        title: "",
        amount: "",
        type: "EXPENSE",
        categoryId: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });

      window.location.reload();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "var(--text-primary)",
    caretColor: "var(--text-primary)",
    WebkitTextFillColor: "var(--text-primary)",
    fontFamily: "var(--font-dm-mono)",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-dm-mono)",
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  return (
    <div className="animate-fade-up">
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "36px" }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(232,255,71,0.5)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </div>

          {(["ALL", "INCOME", "EXPENSE"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background:
                  filter === f ? "rgba(232,255,71,0.1)" : "transparent",
                color: filter === f ? "#e8ff47" : "var(--text-muted)",
                fontFamily: "var(--font-dm-mono)",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}

          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "10px",
              border: "none",
              background: "#e8ff47",
              color: "#080808",
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Transaction", "Category", "Date", "Amount", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 20px",
                    textAlign: "left",
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 400,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  No transactions found
                </td>
              </tr>
            )}
            {filtered.map((t) => {
              // ── Resolve icon and color for this transaction ────────

              return (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Title + Icon */}
                  <td style={{ padding: "14px 20px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                     <CategoryIcon
  name={t.category?.name ?? ""}
  color={t.category?.color}
  size="md"
/>
                      <span
                        style={{
                          fontFamily: "var(--font-syne)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {t.title}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.05)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {t.category?.name ?? "Uncategorized"}
                    </span>
                  </td>

                  {/* Date */}
                  <td
                    style={{
                      padding: "14px 20px",
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {formatDate(t.date)}
                  </td>

                  {/* Amount */}
                  <td
                    style={{
                      padding: "14px 20px",
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color:
                        t.type === "INCOME"
                          ? "#47ffe8"
                          : "rgba(255,255,255,0.8)",
                    }}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount, currency)}
                  </td>

                  {/* Delete */}
                  <td style={{ padding: "14px 20px" }}>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={isPending}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ff6b47",
                        cursor: isPending ? "not-allowed" : "pointer",
                        padding: "6px",
                        borderRadius: "6px",
                        opacity: 0,
                        transition: "opacity 0.2s, background 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      className="delete-btn"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,107,71,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add Transaction Modal ─────────────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              borderRadius: "20px",
              padding: "28px",
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                }}
              >
                Add Transaction
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Type toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      fontFamily: "var(--font-syne)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background:
                        form.type === t
                          ? t === "INCOME"
                            ? "rgba(71,255,232,0.15)"
                            : "rgba(255,107,71,0.15)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        form.type === t
                          ? t === "INCOME"
                            ? "#47ffe8"
                            : "#ff6b47"
                          : "var(--text-muted)",
                      border:
                        form.type === t
                          ? `1px solid ${t === "INCOME" ? "rgba(71,255,232,0.3)" : "rgba(255,107,71,0.3)"}`
                          : "1px solid var(--border)",
                    }}
                  >
                    {t === "INCOME" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  placeholder="e.g. Grocery Store"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(232,255,71,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                  }
                />
              </div>

              {/* Amount */}
              <div>
                <label style={labelStyle}>Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(232,255,71,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                  }
                />
              </div>

              {/* Category + Date */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categoryId: e.target.value }))
                    }
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(232,255,71,0.5)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={labelStyle}>Note (optional)</label>
                <input
                  placeholder="Any additional details..."
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(232,255,71,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                  }
                />
              </div>

              {/* Error */}
              {formError && (
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "12px",
                    color: "#ff6b47",
                  }}
                >
                  {formError}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleAdd}
                disabled={isPending}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#e8ff47",
                  color: "#080808",
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.6 : 1,
                  transition: "opacity 0.2s",
                  marginTop: "4px",
                }}
              >
                {isPending ? "Adding..." : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        tr:hover .delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}