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
  ChevronLeft,
  Bell,
} from "lucide-react";
import { BudgetAlertToast } from "../ui/BudgetAlertToast";
import Image from "next/image";

const navItems = [
  { href: "/dashboard",    label: "Overview",     icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets",      label: "Budgets",      icon: Target },
  { href: "/analytics",   label: "Analytics",    icon: BarChart2 },
  { href: "/settings",    label: "Settings",     icon: Settings },
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
const { data: session, status } = useSession();
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
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg-base)" }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        className="desktop-sidebar"
        style={{
          width: sidebarOpen ? "220px" : "64px",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          transition: "width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          zIndex: 10,
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarOpen ? "space-between" : "center",
            padding: "0 12px",
            height: "56px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
            {/* Logo mark */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "14px",
                color: "#080808",
                flexShrink: 0,
                letterSpacing: "-0.05em",
              }}
            >
              S
            </div>
            {sidebarOpen && (
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1, whiteSpace: "nowrap" }}>
                  Spendly
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", whiteSpace: "nowrap" }}>
                  Finance
                </p>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                width: "26px", height: "26px", display: "flex", alignItems: "center",
                justifyContent: "center", borderRadius: "7px",
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-muted)", cursor: "pointer", flexShrink: 0,
              }}
            >
              <ChevronLeft size={13} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ padding: "8px", flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={!sidebarOpen ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: sidebarOpen ? "9px 10px" : "9px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  background: active ? "rgba(232,255,71,0.12)" : "transparent",
                  color: active ? "#e8ff47" : "var(--text-muted)",
                  transition: "background 0.15s, color 0.15s",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  position: "relative",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
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
                <Icon size={16} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                {sidebarOpen && (
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: active ? 700 : 500 }}>
                    {label}
                  </span>
                )}
                {/* Budget alert badge */}
                {label === "Budgets" && alertCount > 0 && (
                  <span
                    style={{
                      marginLeft: sidebarOpen ? "auto" : undefined,
                      position: sidebarOpen ? "static" : "absolute",
                      top: sidebarOpen ? undefined : "6px",
                      right: sidebarOpen ? undefined : "6px",
                      background: "#ff6b47",
                      color: "#fff",
                      fontSize: "9px",
                      fontFamily: "var(--font-mono)",
                      padding: sidebarOpen ? "1px 6px" : "0",
                      width: sidebarOpen ? "auto" : "8px",
                      height: sidebarOpen ? "auto" : "8px",
                      borderRadius: "20px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {sidebarOpen ? alertCount : ""}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          {/* Live indicator */}
          {sidebarOpen && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: connected ? "rgba(71,255,232,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${connected ? "rgba(71,255,232,0.15)" : "var(--border)"}`,
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                  background: connected ? "#47ffe8" : "var(--text-muted)",
                  boxShadow: connected ? "0 0 6px #47ffe8" : "none",
                }}
                className={connected ? "pulse-dot" : ""}
              />
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: connected ? "#47ffe8" : "var(--text-muted)", fontWeight: 600, lineHeight: 1 }}>
                  {connected ? "Live Alerts" : "Connecting..."}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {alertCount} received
                </p>
              </div>
            </div>
          )}

          {/* Expand button when collapsed */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Expand sidebar"
              style={{
                width: "100%", height: "36px", display: "flex", alignItems: "center",
                justifyContent: "center", borderRadius: "10px", border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                marginBottom: "6px",
              }}
            >
              <Menu size={14} />
            </button>
          )}

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: sidebarOpen ? "9px 10px" : "9px", borderRadius: "10px",
              border: "none", background: "transparent", color: "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s",
              justifyContent: sidebarOpen ? "flex-start" : "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,71,0.08)"; e.currentTarget.style.color = "#ff6b47"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            {sidebarOpen && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>Sign out</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: "56px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
            flexShrink: 0,
            gap: "12px",
            zIndex: 5,
          }}
        >
          {/* Left: mobile logo + page title */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {/* Mobile logo — hidden on desktop via CSS */}
            <div
              className="mobile-only"
              style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "12px", color: "#080808", flexShrink: 0,
              }}
            >
              S
            </div>

            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1 }}>
                {currentPage?.label ?? "Dashboard"}
              </h1>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", whiteSpace: "nowrap" }}>
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* Alerts bell — mobile only */}
            {alertCount > 0 && (
              <div
                className="mobile-only"
                style={{ position: "relative" }}
              >
                <button
                  style={{
                    width: "34px", height: "34px", display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: "9px", border: "1px solid var(--border)",
                    background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  <Bell size={14} />
                </button>
                <span
                  style={{
                    position: "absolute", top: "4px", right: "4px",
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#ff6b47",
                  }}
                />
              </div>
            )}

            {/* Quick add */}
            <Link
              href="/transactions"
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "7px 13px", borderRadius: "9px",
                background: "#e8ff47", color: "#080808",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "12px",
                textDecoration: "none", whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              + Add
            </Link>

            {/* Avatar */}

<Link
  href="/settings"
  style={{
    width: "32px",
    height: "32px",
    borderRadius: "9px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    textDecoration: "none",
    transition: "opacity 0.15s",
    border: "1px solid var(--border)",
  }}
  title="Profile Settings"
  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
>
  {status === "loading" ? (
    <div style={{
      width: "100%",
      height: "100%",
      background: "rgba(255,255,255,0.06)",
    }} />
  ) : session?.user?.avatarUrl ? (
    <Image
      src={session.user.avatarUrl}
      alt="Avatar"
      width={32}
      height={32}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: "13px",
        color: "#080808",
      }}
    >
      {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
    </div>
  )}
</Link>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px 20px 88px 20px", // 88px bottom padding for mobile nav
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border)",
          zIndex: 100,
          display: "none", // shown via CSS class
          alignItems: "center",
          justifyContent: "space-around",
          padding: "8px 4px",
          paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
          boxSizing: "border-box",
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
                padding: "6px 10px",
                borderRadius: "10px",
                textDecoration: "none",
                color: active ? "#e8ff47" : "var(--text-muted)",
                transition: "color 0.15s",
                minWidth: "48px",
                position: "relative",
                flex: 1,
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#e8ff47",
                  }}
                />
              )}
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>
                {label === "Transactions" ? "Txns" : label}
              </span>
              {/* Budget alert dot */}
              {label === "Budgets" && alertCount > 0 && (
                <span
                  style={{
                    position: "absolute", top: "4px", right: "8px",
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: "#ff6b47",
                    border: "1px solid var(--bg-card)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toast alerts */}
      <div
        style={{
          position: "fixed",
          top: "68px",
          right: "16px",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "320px",
          width: "calc(100vw - 32px)",
          pointerEvents: "none",
        }}
      >
        {alerts.map((alert) => (
          <div key={alert.id} style={{ pointerEvents: "all" }}>
            <BudgetAlertToast
              alert={alert}
              onDismiss={() => dismissAlert(alert.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}