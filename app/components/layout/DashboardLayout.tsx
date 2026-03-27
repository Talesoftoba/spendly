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
  { href: "/dashboard",    label: "Overview",      icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions",  icon: ArrowLeftRight },
  { href: "/budgets",      label: "Budgets",       icon: Target },
  { href: "/analytics",   label: "Analytics",     icon: BarChart2 },
  { href: "/settings",    label: "Settings",      icon: Settings },
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

  // SSE Connection
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

  const currentPage = navItems.find((n) => n.href === pathname);

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--bg-base)",
        fontFamily: "var(--font-display)",
      }}
    >
      {/* ── Desktop Sidebar ───────────────────────────────────── */}
      <aside
        className="desktop-sidebar"
        style={{
          width: sidebarOpen ? "220px" : "64px",
          flexDirection: "column",
          flexShrink: 0,
          transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: sidebarOpen ? "20px 16px" : "20px 14px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "15px",
              color: "#080808",
              flexShrink: 0,
              letterSpacing: "-0.05em",
            }}
          >
            S
          </div>
          {sidebarOpen && (
            <div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "16px",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                Spendly
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Finance
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          style={{
            padding: "10px 8px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            overflowY: "auto",
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
                  gap: "10px",
                  padding: sidebarOpen ? "9px 10px" : "9px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  background: active
                    ? "rgba(232,255,71,0.12)"
                    : "transparent",
                  color: active
                    ? "#e8ff47"
                    : "var(--text-muted)",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {sidebarOpen && (
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "13px",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {label}
                  </span>
                )}
                {label === "Budgets" && alertCount > 0 && sidebarOpen && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "#ff6b47",
                      color: "#fff",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      padding: "1px 6px",
                      borderRadius: "20px",
                      fontWeight: 600,
                    }}
                  >
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "8px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {/* SSE indicator */}
          {sidebarOpen && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: connected
                  ? "rgba(71,255,232,0.06)"
                  : "var(--bg-elevated)",
                border: connected
                  ? "1px solid rgba(71,255,232,0.15)"
                  : "1px solid var(--border)",
                marginBottom: "6px",
              }}
            >
              <span
                className={connected ? "pulse-dot" : ""}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: connected
                    ? "#47ffe8"
                    : "var(--text-muted)",
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: connected ? "#47ffe8" : "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {connected ? "Live Alerts" : "Connecting..."}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
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
              padding: sidebarOpen ? "9px 10px" : "9px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
              justifyContent: sidebarOpen ? "flex-start" : "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-elevated)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {sidebarOpen && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              >
                Sign out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
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
            padding: "0 20px",
            height: "56px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
            backdropFilter: "blur(12px)",
            flexShrink: 0,
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: 0,
            }}
          >
            {/* Desktop sidebar toggle */}
            <button
              className="desktop-only"
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
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
            </button>

           {/* Mobile logo — only shows on mobile */}
<div
  style={{
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "13px",
    color: "#080808",
    flexShrink: 0,
  }}
  className="mobile-only"
>
  S
</div>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentPage?.label ?? "Dashboard"}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <Link
              href="/transactions"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "7px 14px",
                borderRadius: "9px",
                background: "#e8ff47",
                color: "#080808",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "12px",
                textDecoration: "none",
                transition: "opacity 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.opacity = "1")
              }
            >
              + Add
            </Link>

            {/* Avatar */}
            <Link
              href="/settings"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "13px",
                color: "#080808",
                flexShrink: 0,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              title="Profile Settings"
              onMouseEnter={(e) =>
                (e.currentTarget.style.opacity = "0.8")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.opacity = "1")
              }
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
            padding: "20px 20px 80px 20px",
          }}
        >
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────────── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border)",
          zIndex: 50,
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 8px",
          paddingBottom: "env(safe-area-inset-bottom)",
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
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                padding: "6px 12px",
                borderRadius: "10px",
                textDecoration: "none",
                color: active ? "#e8ff47" : "var(--text-muted)",
                transition: "all 0.15s",
                minWidth: "52px",
                position: "relative",
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "10px",
                  fontWeight: active ? 700 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {label === "Transactions" ? "Txns" : label}
              </span>
              {label === "Budgets" && alertCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "8px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#ff6b47",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* SSE Toast Alerts */}
      <div
        style={{
          position: "fixed",
          top: "70px",
          right: "16px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "320px",
          width: "calc(100vw - 32px)",
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