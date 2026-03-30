"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Plus, Trash2, X, SlidersHorizontal, CreditCard } from "lucide-react";
import { createTransaction, deleteTransaction } from "../lib/actions";
import { formatCurrency, formatDate } from "../lib/utils";
import { useCurrency } from "../components/layout/CurrencyProvider";
import type { TransactionWithCategory, Category } from "@/types";
import { categoryIcons, categoryColors } from "../lib/categoryConfig";

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
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, startTransition] = useTransition();
   const router = useRouter(); // 👈 ADD THIS

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
    const matchSearch = t.title
      .toLowerCase()
      .includes(search.toLowerCase());
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
        categoryId: form.categoryId || undefined,
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

     router.refresh();
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
    background: "rgba(255,255,255,0.06)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "var(--text-primary)",
    caretColor: "var(--text-primary)",
    WebkitTextFillColor: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  return (
    <div className="animate-fade-up">

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: "36px",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(232,255,71,0.5)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--border)")
            }
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((o) => !o)}
          style={{
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            border: `1px solid ${
              showFilters ? "rgba(232,255,71,0.5)" : "var(--border)"
            }`,
            background: showFilters
              ? "rgba(232,255,71,0.1)"
              : "var(--bg-card)",
            color: showFilters ? "#e8ff47" : "var(--text-muted)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          <SlidersHorizontal size={15} />
        </button>

        {/* Add button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            border: "none",
            background: "#e8ff47",
            color: "#080808",
            cursor: "pointer",
            flexShrink: 0,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={17} />
        </button>
      </div>

      {/* ── Filter Pills ──────────────────────────────────────── */}
      {showFilters && (
        <div
          className="animate-fade-up"
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          {(["ALL", "INCOME", "EXPENSE"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 16px",
                borderRadius: "20px",
                border: `1px solid ${
                  filter === f
                    ? "rgba(232,255,71,0.4)"
                    : "var(--border)"
                }`,
                background:
                  filter === f
                    ? "rgba(232,255,71,0.12)"
                    : "var(--bg-card)",
                color: filter === f ? "#e8ff47" : "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: filter === f ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}

          {filter !== "ALL" && (
            <button
              onClick={() => setFilter("ALL")}
              style={{
                padding: "7px 12px",
                borderRadius: "20px",
                border: "1px solid rgba(255,107,71,0.3)",
                background: "rgba(255,107,71,0.1)",
                color: "#ff6b47",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ── Count ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          {filtered.length} transaction
          {filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </p>
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#e8ff47",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear search
          </button>
        )}
      </div>

      {/* ── Transaction List ───────────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{ padding: "48px 24px", textAlign: "center" }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              No transactions found
            </p>
            {(search || filter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "#e8ff47",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((t, index) => {
              const Icon =
                t.category?.name
                  ? categoryIcons[t.category.name] ?? CreditCard
                  : CreditCard;
              const iconColor =
                t.category?.name
                  ? categoryColors[t.category.name] ??
                    "rgba(255,255,255,0.4)"
                  : "rgba(255,255,255,0.4)";
              const bgColor =
                t.category?.name
                  ? categoryColors[t.category.name]
                  : null;

              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    borderBottom:
                      index < filtered.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* ── Icon ─────────────────────────────────── */}
                  <span
                    style={{
                      width: "40px",
                      height: "40px",
                      minWidth: "40px",
                      borderRadius: "12px",
                      background: bgColor
                        ? `${bgColor}18`
                        : "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      size={16}
                      color={iconColor}
                      strokeWidth={2}
                    />
                  </span>

                  {/* ── Title + meta ──────────────────────────── */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0, // ← critical — allows text to truncate
                      overflow: "hidden",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: "4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {t.category && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {t.category.name}
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {formatDate(t.date)}
                      </span>
                    </div>
                  </div>

                  {/* ── Amount + Delete ───────────────────────── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0, // ← never shrink — always visible
                      marginLeft: "auto",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        fontWeight: 700,
                        color:
                          t.type === "INCOME"
                            ? "#47ffe8"
                            : "var(--text-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(t.amount, currency)}
                    </p>

                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={isPending}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: isPending
                          ? "not-allowed"
                          : "pointer",
                        padding: "6px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        opacity: 0.4,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ff6b47";
                        e.currentTarget.style.background =
                          "rgba(255,107,71,0.1)";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          "var(--text-muted)";
                        e.currentTarget.style.background =
                          "transparent";
                        e.currentTarget.style.opacity = "0.4";
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Transaction Modal ──────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            paddingTop: "56px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              width: "100%",
              maxWidth: "520px",
              borderRadius: "20px 20px 0 0",
              padding: "20px 24px 40px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderBottom: "none",
              maxHeight: "calc(100dvh - 56px)",
              overflowY: "auto",
            }}
          >
            {/* Handle bar */}
            <div
              style={{
                width: "36px",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(255,255,255,0.15)",
                margin: "0 auto 20px",
              }}
            />

            {/* Modal header */}
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
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                }}
              >
                Add Transaction
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  padding: "4px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                }}
              >
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      setForm((f) => ({ ...f, type: t }))
                    }
                    style={{
                      padding: "10px",
                      borderRadius: "9px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: "none",
                      background:
                        form.type === t
                          ? t === "INCOME"
                            ? "rgba(71,255,232,0.15)"
                            : "rgba(255,107,71,0.15)"
                          : "transparent",
                      color:
                        form.type === t
                          ? t === "INCOME"
                            ? "#47ffe8"
                            : "#ff6b47"
                          : "var(--text-muted)",
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
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(232,255,71,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border)")
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
                    setForm((f) => ({
                      ...f,
                      amount: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(232,255,71,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border)")
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
                      setForm((f) => ({
                        ...f,
                        categoryId: e.target.value,
                      }))
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
                      setForm((f) => ({
                        ...f,
                        date: e.target.value,
                      }))
                    }
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "rgba(232,255,71,0.5)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
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
                    setForm((f) => ({
                      ...f,
                      note: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(232,255,71,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border)")
                  }
                />
              </div>

              {/* Error */}
              {formError && (
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "#ff6b47",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(255,107,71,0.08)",
                    border: "1px solid rgba(255,107,71,0.2)",
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
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#e8ff47",
                  color: "#080808",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.6 : 1,
                  transition: "opacity 0.2s",
                  letterSpacing: "-0.02em",
                }}
              >
                {isPending ? "Adding..." : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}