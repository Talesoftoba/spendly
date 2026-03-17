"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { BudgetAlertToast } from "../ui/BudgetAlertToast"; 

const navItems = [
  { href: "/dashboard",     label: "Overview",      icon: LayoutDashboard },
  { href: "/transactions",  label: "Transactions",  icon: ArrowLeftRight },
  { href: "/budgets",       label: "Budgets",       icon: Target },
  { href: "/analytics",     label: "Analytics",     icon: BarChart2 },
  { href: "/settings",      label: "Settings",      icon: Settings },
];

type Alert = {
  id: string;
  categoryName: string;
  spent: number;
  limit: number;
  overBy: number;
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [connected, setConnected] = useState(false);

  // ── SSE Connection ─────────────────────────────────────────────────────
  useEffect(() => {
    const eventSource = new EventSource("/api/sse");

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "budget_alert") {
        const newAlert: Alert = {
          id: `${data.categoryName}-${Date.now()}`,
          categoryName: data.categoryName,
          spent: data.spent,
          limit: data.limit,
          overBy: data.overBy,
        };
        setAlerts((prev) => [...prev, newAlert]);
        setAlertCount((c) => c + 1);
      }
    };

    eventSource.onerror = () => setConnected(false);

    return () => eventSource.close();
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarOpen ? "240px" : "72px",
          background: "rgba(255,255,255,0.02)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          transition: "width 0.3s ease",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "16px",
              color: "#080808",
              flexShrink: 0,
            }}
          >
            S
          </div>
          {sidebarOpen && (
            <div>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 800,
                  fontSize: "15px",
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                Spendly
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                }}
              >
                Finance
              </p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav
          style={{
            padding: "12px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  background: active
                    ? "rgba(232,255,71,0.1)"
                    : "transparent",
                  color: active ? "#e8ff47" : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                  }
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {sidebarOpen && (
                  <span
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "13px",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {label}
                  </span>
                )}
                {/* Budget alert badge */}
                {label === "Budgets" && alertCount > 0 && sidebarOpen && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "#ff6b47",
                      color: "#fff",
                      fontSize: "10px",
                      fontFamily: "var(--font-dm-mono)",
                      padding: "2px 7px",
                      borderRadius: "20px",
                      fontWeight: 500,
                    }}
                  >
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — SSE status + sign out */}
        <div
          style={{
            padding: "12px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {/* SSE live indicator */}
          {sidebarOpen && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(71,255,232,0.06)",
                border: "1px solid rgba(71,255,232,0.15)",
                marginBottom: "8px",
              }}
            >
              <span
                className={connected ? "pulse-dot" : ""}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: connected ? "#47ffe8" : "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "10px",
                    color: "#47ffe8",
                  }}
                >
                  Live Alerts
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                  }}
                >
                  {alertCount} received
                </p>
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.3)";
            }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            {sidebarOpen && (
              <span
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "12px",
                }}
              >
                Sign out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 32px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(8,8,8,0.8)",
            backdropFilter: "blur(12px)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
            </button>

            <div>
              <h1
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                }}
              >
                {navItems.find((n) => n.href === pathname)?.label ?? "Dashboard"}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Right side — add button + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/transactions"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "10px",
                background: "#e8ff47",
                color: "#080808",
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.opacity = "1")
              }
            >
              + Add Transaction
            </Link>

            {/* User avatar */}
         <Link
  href="/settings"
  style={{
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-syne)",
    fontWeight: 800,
    fontSize: "14px",
    color: "#080808",
    flexShrink: 0,
    textDecoration: "none",
    cursor: "pointer",
    transition: "opacity 0.2s",
  }}
  title="Profile Settings"
  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
>
  {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
</Link>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
          }}
        >
          {children}
        </main>
      </div>

      {/* ── SSE Toast Alerts ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {alerts.map((alert) => (
          <BudgetAlertToast
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id)}
          />
        ))}
      </div>
    </div>
  );
}