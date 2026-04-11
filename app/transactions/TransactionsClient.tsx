"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  X,
  SlidersHorizontal,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
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

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [formError, setFormError] = useState("");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

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
        categoryId: form.categoryId || undefined,
      });

      if ("error" in result) {
        setFormError("Something went wrong. Please try again.");
        return;
      }

      // Update local state optimistically
      setTransactions((prev) => [result as TransactionWithCategory, ...prev]);

      // Close modal and reset form
      setShowModal(false);
      setForm({
        title: "",
        amount: "",
        type: "EXPENSE",
        categoryId: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });

      // Signal the layout to reconnect SSE for fresh budget check.
      // Do NOT call router.refresh() here — it causes a double SSE
      // reconnect which triggers duplicate budget alerts.
      window.dispatchEvent(new CustomEvent("transaction:added"));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      // Also trigger a fresh budget check after deletion
      window.dispatchEvent(new CustomEvent("transaction:added"));
    });
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    display: "block",
    WebkitAppearance: "none",
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
    <>
      <div className="animate-fade-up">

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <Search
              size={14}
              style={{
                position: "absolute", left: "12px", top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none",
              }}
            />
            <input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...fieldStyle, paddingLeft: "36px" }}
            />
          </div>

          <button
            onClick={() => setShowFilters((o) => !o)}
            style={{
              width: "42px", height: "42px", display: "flex", alignItems: "center",
              justifyContent: "center", borderRadius: "10px", flexShrink: 0,
              border: `1px solid ${showFilters ? "rgba(232,255,71,0.5)" : "var(--border)"}`,
              background: showFilters ? "rgba(232,255,71,0.1)" : "var(--bg-card)",
              color: showFilters ? "#e8ff47" : "var(--text-muted)", cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={15} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "42px", height: "42px", display: "flex", alignItems: "center",
              justifyContent: "center", borderRadius: "10px", border: "none",
              background: "#e8ff47", color: "#080808", cursor: "pointer", flexShrink: 0,
            }}
          >
            <Plus size={17} />
          </button>
        </div>

        {/* ── Filter Pills ── */}
        {showFilters && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            {(["ALL", "INCOME", "EXPENSE"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 16px", borderRadius: "20px", cursor: "pointer",
                  border: `1px solid ${filter === f ? "rgba(232,255,71,0.4)" : "var(--border)"}`,
                  background: filter === f ? "rgba(232,255,71,0.12)" : "var(--bg-card)",
                  color: filter === f ? "#e8ff47" : "var(--text-muted)",
                  fontFamily: "var(--font-mono)", fontSize: "12px",
                  fontWeight: filter === f ? 600 : 400,
                }}
              >
                {f}
              </button>
            ))}
            {filter !== "ALL" && (
              <button
                onClick={() => setFilter("ALL")}
                style={{
                  padding: "7px 12px", borderRadius: "20px", cursor: "pointer",
                  border: "1px solid rgba(255,107,71,0.3)", background: "rgba(255,107,71,0.1)",
                  color: "#ff6b47", fontFamily: "var(--font-mono)", fontSize: "12px",
                  display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}

        {/* ── Count ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#e8ff47", background: "none", border: "none", cursor: "pointer" }}
            >
              Clear search
            </button>
          )}
        </div>

        {/* ── Transaction List ── */}
        <div style={{ borderRadius: "16px", overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
                No transactions found
              </p>
              {(search || filter !== "ALL") && (
                <button
                  onClick={() => { setSearch(""); setFilter("ALL"); }}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#e8ff47", background: "none", border: "none", cursor: "pointer" }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((t, index) => {
                const Icon = t.category?.name ? categoryIcons[t.category.name] ?? CreditCard : CreditCard;
                const iconColor = t.category?.name ? categoryColors[t.category.name] ?? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.4)";
                const bgColor = t.category?.name ? categoryColors[t.category.name] : null;

                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "14px 16px",
                      borderBottom: index < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span
                      style={{
                        width: "40px", height: "40px", minWidth: "40px", borderRadius: "12px",
                        background: bgColor ? `${bgColor}18` : "rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={iconColor} strokeWidth={2} />
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {t.category && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "2px 7px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                            {t.category.name}
                          </span>
                        )}
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {formatDate(t.date)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: t.type === "INCOME" ? "#47ffe8" : "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount, currency)}
                      </p>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isPending}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: isPending ? "not-allowed" : "pointer", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", opacity: 0.4 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#ff6b47"; e.currentTarget.style.background = "rgba(255,107,71,0.1)"; e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = "0.4"; }}
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
      </div>

      {/* ── Centered Modal ── */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {/* Sticky header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                borderBottom: "1px solid var(--border)",
                position: "sticky",
                top: 0,
                background: "var(--bg-card)",
                zIndex: 2,
                borderRadius: "20px 20px 0 0",
              }}
            >
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", margin: 0 }}>
                Add Transaction
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
                  borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer",
                  padding: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Type toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    style={{
                      padding: "11px",
                      borderRadius: "10px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      border: `1px solid ${
                        form.type === t
                          ? t === "INCOME" ? "rgba(71,255,232,0.4)" : "rgba(255,107,71,0.4)"
                          : "var(--border)"
                      }`,
                      background:
                        form.type === t
                          ? t === "INCOME" ? "rgba(71,255,232,0.1)" : "rgba(255,107,71,0.1)"
                          : "rgba(255,255,255,0.03)",
                      color:
                        form.type === t
                          ? t === "INCOME" ? "#47ffe8" : "#ff6b47"
                          : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {t === "INCOME" ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
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
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={fieldStyle}
                />
              </div>

              {/* Amount */}
              <div>
                <label style={labelStyle}>Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  style={fieldStyle}
                />
              </div>

              {/* Category + Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    style={{ ...fieldStyle, cursor: "pointer" }}
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    style={fieldStyle}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={labelStyle}>Note (optional)</label>
                <input
                  placeholder="Any additional details..."
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  style={fieldStyle}
                />
              </div>

              {/* Error */}
              {formError && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ff6b47", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,107,71,0.08)", border: "1px solid rgba(255,107,71,0.2)", margin: 0 }}>
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
                  letterSpacing: "-0.02em",
                  boxSizing: "border-box",
                  marginTop: "4px",
                }}
              >
                {isPending ? "Adding..." : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}