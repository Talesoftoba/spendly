"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "../components/layout/ThemeProvider";
import { updateProfile } from "../lib/actions";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();

  const [name, setName]           = useState("");
  const [currency, setCurrency]   = useState("USD");
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [mounted, setMounted]     = useState(false);
  const mountedRef                = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    Promise.resolve().then(() => {
      setMounted(true);
      if (session?.user?.name) setName(session.user.name);
    });
  }, [session?.user?.name]);

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError("Name cannot be empty");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const result = await updateProfile({ name: name.trim(), currency });

      if ("error" in result) {
        setSaveError("Failed to save. Please try again.");
        setSaving(false);
        return;
      }

      // Update JWT token with new name — no page reload needed
      await update({ name: name.trim() });

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "var(--text-primary)",
    caretColor: "var(--text-primary)",
    WebkitTextFillColor: "var(--text-primary)",
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

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-syne)",
    fontSize: "16px",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    marginBottom: "24px",
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: "560px" }}>

      {/* ── Profile ──────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Profile</p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Avatar row */}
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
              {name?.[0]?.toUpperCase() ?? session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "var(--text-primary)",
                  marginBottom: "2px",
                }}
              >
                {name || session?.user?.name || "User"}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
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
              value={session?.user?.email ?? ""}
              type="email"
              readOnly
              style={{
                ...inputStyle,
                opacity: 0.5,
                cursor: "not-allowed",
              }}
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
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
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

          {/* Error */}
          {saveError && (
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "12px",
                color: "#ff6b47",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(255,107,71,0.08)",
                border: "1px solid rgba(255,107,71,0.2)",
              }}
            >
              {saveError}
            </p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
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
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "all 0.3s",
              marginTop: "4px",
            }}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Appearance ───────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Appearance</p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {[
            { value: "dark",  label: "Dark",  sub: "Easy on the eyes" },
            { value: "light", label: "Light", sub: "Clean and bright"  },
          ].map((t) => {
            const active = mounted
              ? theme === t.value
              : t.value === "dark";

            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value as "dark" | "light")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: `1px solid ${
                    active
                      ? "rgba(232,255,71,0.3)"
                      : "var(--border)"
                  }`,
                  background: active
                    ? "rgba(232,255,71,0.05)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "2px",
                    }}
                  >
                    {t.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t.sub}
                  </p>
                </div>
                {active && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#e8ff47",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Account ──────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Account</p>

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
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
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
          <span
            style={{ color: "var(--text-muted)", fontSize: "18px" }}
          >
            →
          </span>
        </button>
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
            e.currentTarget.style.background =
              "rgba(255,107,71,0.2)";
            e.currentTarget.style.borderColor =
              "rgba(255,107,71,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "rgba(255,107,71,0.1)";
            e.currentTarget.style.borderColor =
              "rgba(255,107,71,0.3)";
          }}
        >
          Delete All Data
        </button>
      </div>
    </div>
  );
}