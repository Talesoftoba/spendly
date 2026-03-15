"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { upsertBudget, deleteBudget } from "../lib/actions";
import { formatCurrency } from "../lib/utils";
import type { BudgetWithCategory, Category } from "@/types";

type Props = {
  budgets: BudgetWithCategory[];
  categories: Category[];
};

export function BudgetsClient({ budgets: initial, categories }: Props) {
  const [budgets, setBudgets] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ categoryId: "", limit: "" });
  const [formError, setFormError] = useState("");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // ── Save budget ───────────────────────────────────────────────────────
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

  // ── Delete budget ─────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#fff",
    caretColor: "#fff",
    WebkitTextFillColor: "#fff",
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

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          {now.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}{" "}
          budgets
        </p>
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
          Set Budget
        </button>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {budgets.length === 0 ? (
        <div
          style={{
            borderRadius: "16px",
            padding: "64px",
            textAlign: "center",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</p>
          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              fontSize: "16px",
              color: "#fff",
              marginBottom: "8px",
            }}
          >
            No budgets set
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Set monthly limits to keep your spending in check
          </p>
        </div>
      ) : (

        /* ── Budget Cards Grid ─────────────────────────────────────── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {budgets.map((b) => {
            const pct = Math.min((b.spent / b.limit) * 100, 100);
            const over = b.spent > b.limit;

            return (
              <div
                key={b.id}
                style={{
                  borderRadius: "16px",
                  padding: "28px",
                  background: "var(--bg-card)",
                  border: `1px solid ${over
                    ? "rgba(255,107,71,0.3)"
                    : "var(--border)"
                    }`,
                  transition: "border-color 0.2s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!over)
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  if (!over)
                    e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>
                      {b.category.icon}
                    </span>
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-syne)",
                          fontWeight: 800,
                          fontSize: "16px",
                          color: "#fff",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {b.category.name}
                      </p>
                      {over && (
                        <span
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontSize: "11px",
                            color: "#ff6b47",
                            background: "rgba(255,107,71,0.1)",
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          Over Budget
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: isPending ? "not-allowed" : "pointer",
                      padding: "4px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ff6b47";
                      e.currentTarget.style.background =
                        "rgba(255,107,71,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Amount display */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "32px",
                        fontWeight: 300,
                        color: "#fff",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatCurrency(b.spent)}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "14px",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                      }}
                    >
                      / {formatCurrency(b.limit)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: "8px",
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: "4px",
                        background: over ? "#ff6b47" : b.category.color,
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Status text */}
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "12px",
                    color: over ? "#ff6b47" : "var(--text-muted)",
                  }}
                >
                  {over
                    ? `${formatCurrency(b.spent - b.limit)} over limit`
                    : `${formatCurrency(b.limit - b.spent)} remaining · ${Math.round(pct)}% used`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Set Budget Modal ────────────────────────────────────────────── */}
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
              maxWidth: "400px",
              borderRadius: "20px",
              padding: "28px",
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
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
                  fontFamily: "var(--font-syne)",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                }}
              >
                Set Budget
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
              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter((c) => c.name !== "Income")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Monthly limit */}
              <div>
                <label style={labelStyle}>Monthly Limit ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={form.limit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, limit: e.target.value }))
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

              {/* Current month info */}
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                }}
              >
                This budget applies to{" "}
                <span style={{ color: "#e8ff47" }}>
                  {now.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                . If a budget already exists for this category it will be
                updated.
              </p>

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
                onClick={handleSave}
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
                {isPending ? "Saving..." : "Save Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}