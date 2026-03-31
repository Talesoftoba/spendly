import { X, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/app/lib/utils"; 

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
        background: "#0f0f0f",
        border: "1px solid rgba(255,107,71,0.4)",
        boxShadow: "0 0 40px rgba(255,107,71,0.15)",
      }}
    >
      {/* Icon */}
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

      {/* Content */}
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
          <span style={{ color: "#fff", fontWeight: 500 }}>
            {alert.categoryName}
          </span>{" "}
          exceeded by{" "}
          <span style={{ color: "#ff6b47" }}>
            {formatCurrency(alert.overBy)}
          </span>
          <br />
          {formatCurrency(alert.spent)} spent of{" "}
          {formatCurrency(alert.limit)} limit
        </p>
      </div>

      {/* Dismiss */}
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