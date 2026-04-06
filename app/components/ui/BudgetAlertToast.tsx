import { X, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/app/lib/utils"; 
import { useCurrency } from "../layout/CurrencyProvider"; 

type Props = {
  alert: {
    id: string;
    categoryName: string;
    spent: number;
    limit: number;
    overBy: number;
  };
  onDismiss: () => void;
};

export function BudgetAlertToast({ alert, onDismiss }: Props) {
  const { currency } = useCurrency();

  return (
    <div
      className="animate-slide-in"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px",
        borderRadius: "16px",
        maxWidth: "320px",
        background: "var(--bg-card)",
        border: "1px solid rgba(255,107,71,0.4)",
        boxShadow: "0 0 40px rgba(255,107,71,0.15)",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: "rgba(255,107,71,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={14} color="#ff6b47" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "13px",
            color: "#ff6b47",
            marginBottom: "4px",
          }}
        >
          Budget Alert
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            {alert.categoryName}
          </span>{" "}
          exceeded by{" "}
          <span style={{ color: "#ff6b47" }}>
            {formatCurrency(alert.overBy, currency)}
          </span>
          <br />
          {formatCurrency(alert.spent, currency)} spent of{" "}
          {formatCurrency(alert.limit, currency)} limit
        </p>
      </div>

      <button
        onClick={onDismiss}
        style={{
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <X size={12} />
      </button>
    </div>
  );
}