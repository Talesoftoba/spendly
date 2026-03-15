"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#fff",
    caretColor: "#fff",
    WebkitTextFillColor: "#fff",
    fontFamily: "var(--font-dm-mono)",
    fontSize: "14px",
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
    marginBottom: "8px",
  };

  const sectionStyle: React.CSSProperties = {
    borderRadius: "16px",
    padding: "28px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    marginBottom: "16px",
  };

  return (
    <div
      className="animate-fade-up"
      style={{ maxWidth: "560px" }}
    >

      {/* ── Profile Section ─────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "16px",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.02em",
            marginBottom: "24px",
          }}
        >
          Profile
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Avatar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                fontSize: "22px",
                color: "#080808",
                flexShrink: 0,
              }}
            >
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#fff",
                  marginBottom: "2px",
                }}
              >
                {session?.user?.name ?? "User"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {session?.user?.email ?? ""}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              defaultValue={session?.user?.name ?? ""}
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(232,255,71,0.5)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              defaultValue={session?.user?.email ?? ""}
              type="email"
              style={{
                ...inputStyle,
                opacity: 0.6,
                cursor: "not-allowed",
              }}
              disabled
            />
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              Email cannot be changed
            </p>
          </div>

          {/* Currency */}
          <div>
            <label style={labelStyle}>Currency</label>
            <select
              defaultValue="USD"
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="NGN">NGN (₦) — Nigerian Naira</option>
              <option value="CAD">CAD ($) — Canadian Dollar</option>
              <option value="AUD">AUD ($) — Australian Dollar</option>
            </select>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            style={{
              alignSelf: "flex-start",
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              background: saved ? "rgba(71,255,232,0.15)" : "#e8ff47",
              color: saved ? "#47ffe8" : "#080808",
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.3s",
              marginTop: "4px",
            }}
          >
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Appearance Section ───────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "16px",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.02em",
            marginBottom: "24px",
          }}
        >
          Appearance
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { label: "Dark",  sub: "Default dark theme",   active: true  },
            { label: "Light", sub: "Coming soon",          active: false },
          ].map((theme) => (
            <div
              key={theme.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "12px",
                border: `1px solid ${theme.active
                  ? "rgba(232,255,71,0.3)"
                  : "var(--border)"
                  }`,
                background: theme.active
                  ? "rgba(232,255,71,0.05)"
                  : "transparent",
                cursor: theme.active ? "default" : "not-allowed",
                opacity: theme.active ? 1 : 0.4,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#fff",
                    marginBottom: "2px",
                  }}
                >
                  {theme.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  {theme.sub}
                </p>
              </div>
              {theme.active && (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#e8ff47",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Account Section ──────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "16px",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.02em",
            marginBottom: "24px",
          }}
        >
          Account
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "2px",
                }}
              >
                Sign Out
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                Sign out of your Spendly account
              </p>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>
              →
            </span>
          </button>
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────────────────────────── */}
      <div
        style={{
          ...sectionStyle,
          border: "1px solid rgba(255,107,71,0.2)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "16px",
            fontWeight: 800,
            color: "#ff6b47",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          Danger Zone
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "20px",
          }}
        >
          These actions are permanent and cannot be undone.
        </p>

        <button
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "1px solid rgba(255,107,71,0.3)",
            background: "rgba(255,107,71,0.1)",
            color: "#ff6b47",
            fontFamily: "var(--font-syne)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,107,71,0.2)";
            e.currentTarget.style.borderColor = "rgba(255,107,71,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,107,71,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,107,71,0.3)";
          }}
        >
          Delete All Data
        </button>
      </div>
    </div>
  );
}