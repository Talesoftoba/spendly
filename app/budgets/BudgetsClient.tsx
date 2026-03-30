"use client";

import { useCurrency } from "../components/layout/CurrencyProvider";
import { useState, useTransition, useEffect } from "react";
import { Plus, X, Target } from "lucide-react";
import { upsertBudget, deleteBudget } from "../lib/actions";
import { formatCurrency } from "../lib/utils";
import type { BudgetWithCategory, Category } from "@/types";
import { CategoryIcon } from "../components/ui/CategoryIcon";

type Props = {
  budgets: BudgetWithCategory[];
  categories: Category[];
};

export function BudgetsClient({ budgets: initial, categories }: Props) {
  const { currency } = useCurrency();
  const [budgets, setBudgets] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ categoryId: "", limit: "" });
  const [formError, setFormError] = useState("");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

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

  const handleSave = () => {
    if (!form.categoryId || !form.limit) {
      setFormError("Category and limit are required");
      return;
    }
    setFormError("");

    startTransition(async () => {
      const result = await upsertBudget({
        categoryId: form.categoryId,
        limit: parseFloat(form.limit),
        month: currentMonth,
        year: currentYear,
      });

      if ("error" in result) {
        setFormError("Something went wrong. Please try again.");
        return;
      }

      setShowModal(false);
      setForm({ categoryId: "", limit: "" });
      window.location.reload();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
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

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>
            {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} budgets
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 18px", borderRadius: "10px", border: "none",
              background: "#e8ff47", color: "#080808",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={14} />
            Set Budget
          </button>
        </div>

        {/* ── Empty state ── */}
        {budgets.length === 0 ? (
          <div style={{ borderRadius: "16px", padding: "64px", textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(232,255,71,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Target size={26} color="#e8ff47" strokeWidth={1.5} />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", marginBottom: "8px" }}>
              No budgets set
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>
              Set monthly limits to keep your spending in check
            </p>
          </div>
        ) : (

          /* ── Budget Cards Grid ── */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {budgets.map((b) => {
              const pct = Math.min((b.spent / b.limit) * 100, 100);
              const over = b.spent > b.limit;

              return (
                <div
                  key={b.id}
                  style={{
                    borderRadius: "16px", padding: "24px",
                    background: "var(--bg-card)",
                    border: `1px solid ${over ? "rgba(255,107,71,0.3)" : "var(--border)"}`,
                    transition: "border-color 0.2s", position: "relative",
                  }}
                  onMouseEnter={(e) => { if (!over) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={(e) => { if (!over) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {/* Card header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <CategoryIcon name={b.category.name} color={b.category.color} size="lg" />
                      <div>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "16px", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                          {b.category.name}
                        </p>
                        {over && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#ff6b47", background: "rgba(255,107,71,0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                            Over Budget
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={isPending}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: isPending ? "not-allowed" : "pointer", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#ff6b47"; e.currentTarget.style.background = "rgba(255,107,71,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Amount display */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "10px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "30px", fontWeight: 300, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                        {formatCurrency(b.spent, currency)}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        / {formatCurrency(b.limit, currency)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: "4px", background: over ? "#ff6b47" : b.category.color, transition: "width 0.8s ease" }} />
                    </div>
                  </div>

                  {/* Status text */}
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: over ? "#ff6b47" : "var(--text-muted)" }}>
                    {over
                      ? `${formatCurrency(b.spent - b.limit, currency)} over limit`
                      : `${formatCurrency(b.limit - b.spent, currency)} remaining · ${Math.round(pct)}% used`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
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
              maxWidth: "420px",
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
                Set Budget
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

              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  style={{ ...fieldStyle, cursor: "pointer" }}
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter((c) => c.name !== "Income")
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              {/* Monthly limit */}
              <div>
                <label style={labelStyle}>Monthly Limit</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 500"
                  value={form.limit}
                  onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
                  style={fieldStyle}
                />
              </div>

              {/* Info note */}
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", margin: 0 }}>
                Applies to{" "}
                <span style={{ color: "#e8ff47" }}>
                  {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                . If a budget already exists for this category it will be updated.
              </p>

              {/* Error */}
              {formError && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ff6b47", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,107,71,0.08)", border: "1px solid rgba(255,107,71,0.2)", margin: 0 }}>
                  {formError}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleSave}
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
                {isPending ? "Saving..." : "Save Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}