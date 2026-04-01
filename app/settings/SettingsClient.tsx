"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "../components/layout/ThemeProvider";
import { useCurrency } from "../components/layout/CurrencyProvider";
import { updateProfile, createCategory, deleteCategory, removeAvatar } from "../lib/actions";
import { CategoryIcon } from "../components/ui/CategoryIcon";
import { Plus, X, Trash2 } from "lucide-react";
import type { Category } from "@/types";
import Image from "next/image";

type Props = {
  categories: Category[];
  savedName: string;
  savedCurrency: string;
};

// ── Preset colors for the color picker ────────────────────────────
const PRESET_COLORS = [
  "#e8ff47", "#47ffe8", "#ff6b47", "#a847ff",
  "#4778ff", "#ff47a8", "#47ff78", "#ffb347",
  "#ff4747", "#47d4ff", "#c847ff", "#ff8c47",
];

export function SettingsClient({
  categories: initialCategories,
  savedName,
  savedCurrency,
}: Props) {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const { setCurrency: updateCurrency } = useCurrency();

  // ── Profile state ──────────────────────────────────────────────
  const [name, setName]           = useState(savedName);
  const [currency, setCurrency]   = useState(savedCurrency);
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [mounted, setMounted]     = useState(false);
  const mountedRef                = useRef(false);

  // ── Avatar state ───────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl]     = useState(session?.user?.avatarUrl ?? "");
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const imageSrc = avatarUrl ?? session?.user?.avatarUrl ?? null;

  // ── Category state ─────────────────────────────────────────────
  const [categories, setCategories]     = useState(initialCategories);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName]           = useState("");
  const [catColor, setCatColor]         = useState("#e8ff47");
  const [catError, setCatError]         = useState("");
  const [deleteError, setDeleteError]   = useState<Record<string, string>>({});
  const [isPending, startTransition]    = useTransition();

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    Promise.resolve().then(() => {
      setMounted(true);
      if (session?.user?.avatarUrl && !avatarUrl) {
        setAvatarUrl(session.user.avatarUrl);
      }
    });
  }, [session?.user?.avatarUrl, avatarUrl]);

  // ── Save profile ───────────────────────────────────────────────
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
      updateCurrency(currency);
      await update({ name: name.trim() });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  // ── Upload avatar ──────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }

      setAvatarUrl(data.avatarUrl);
      await update({ avatarUrl: data.avatarUrl });
      setUploading(false);
    } catch {
      setUploadError("Something went wrong");
      setUploading(false);
    }
  };

  // ── Remove avatar ──────────────────────────────────────────────
const handleRemoveAvatar = async () => {
  await removeAvatar();
  setAvatarUrl("");
  await update({ avatarUrl: null }); // ← now correctly passes null through the jwt callback
};

  // ── Create category ────────────────────────────────────────────
  const handleCreateCategory = () => {
    if (!catName.trim()) {
      setCatError("Name is required");
      return;
    }
    setCatError("");

    startTransition(async () => {
      const result = await createCategory({
        name: catName.trim(),
        color: catColor,
      });

      if ("error" in result) {
        const err = result.error;
        if (typeof err === "object" && err !== null && "name" in err) {
          setCatError((err as Record<string, string[]>).name[0]);
        } else {
          setCatError("Something went wrong");
        }
        return;
      }

      if ("category" in result && result.category) {
        setCategories((prev) => [...prev, result.category as Category]);
      }

      setShowCatModal(false);
      setCatName("");
      setCatColor("#e8ff47");
    });
  };

  // ── Delete category ────────────────────────────────────────────
  const handleDeleteCategory = (id: string) => {
    setDeleteError((prev) => ({ ...prev, [id]: "" }));

    startTransition(async () => {
      const result = await deleteCategory(id);

      if ("error" in result) {
        setDeleteError((prev) => ({
          ...prev,
          [id]: typeof result.error === "string"
            ? result.error
            : "Cannot delete this category",
        }));
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  };

  // ── Styles ─────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "var(--text-primary)",
    caretColor: "var(--text-primary)",
    WebkitTextFillColor: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-mono)",
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
    fontFamily: "var(--font-display)",
    fontSize: "16px",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    marginBottom: "24px",
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: "560px" }}>

      {/* ── Profile ────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Profile</p>
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
            {/* Avatar box */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt="Avatar"
                  width={64}
                  height={64}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "14px",
                    objectFit: "cover",
                    border: "2px solid var(--border)",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "24px",
                    color: "#080808",
                  }}
                >
                  {name?.[0]?.toUpperCase() ??
                    session?.user?.name?.[0]?.toUpperCase() ??
                    "U"}
                </div>
              )}

              {/* Upload button */}
              <label
                htmlFor="avatar-upload"
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  right: "-6px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "7px",
                  background: "#e8ff47",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: uploading ? "not-allowed" : "pointer",
                  border: "2px solid var(--bg-card)",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#080808"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </label>

              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={handleAvatarUpload}
                style={{ display: "none" }}
              />
            </div>

            {/* Name, email, status, remove option */}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "var(--text-primary)",
                  marginBottom: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name || session?.user?.name || "User"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session?.user?.email ?? ""}
              </p>

              {/* Status messages */}
              {uploading && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#47ffe8", marginTop: "4px" }}>
                  Uploading...
                </p>
              )}
              {uploadError && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#ff6b47", marginTop: "4px" }}>
                  {uploadError}
                </p>
              )}

              {/* Action hints */}
              {!uploading && !uploadError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    Click icon to change photo
                  </p>

                  {imageSrc && (
                    <button
                      onClick={handleRemoveAvatar}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "#ff6b47",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              )}
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
              onFocus={(e) => (e.target.style.borderColor = "rgba(232,255,71,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              value={session?.user?.email ?? ""}
              type="email"
              readOnly
              style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
            />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
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
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ff6b47", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,107,71,0.08)", border: "1px solid rgba(255,107,71,0.2)" }}>
              {saveError}
            </p>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              alignSelf: "flex-start", padding: "10px 24px", borderRadius: "10px",
              border: "none", background: saved ? "rgba(71,255,232,0.15)" : "#e8ff47",
              color: saved ? "#47ffe8" : "#080808", fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: "13px", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1, transition: "all 0.3s", marginTop: "4px",
            }}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Categories ─────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <p style={sectionTitleStyle}>Categories</p>
          <button
            onClick={() => setShowCatModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "10px", border: "none",
              background: "#e8ff47", color: "#080808", fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: "12px", cursor: "pointer", transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={13} />
            New
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {categories.map((cat) => (
            <div key={cat.id}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 14px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <CategoryIcon name={cat.name} color={cat.color} size="md" />

                <p
                  style={{
                    flex: 1, fontFamily: "var(--font-display)", fontSize: "14px",
                    fontWeight: 600, color: "var(--text-primary)",
                  }}
                >
                  {cat.name}
                </p>

                <span
                  style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: cat.color, flexShrink: 0,
                  }}
                />

                {!["Housing", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Income"].includes(cat.name) ? (
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={isPending}
                    style={{
                      background: "none", border: "none", color: "var(--text-muted)",
                      cursor: isPending ? "not-allowed" : "pointer",
                      padding: "4px", borderRadius: "6px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ff6b47";
                      e.currentTarget.style.background = "rgba(255,107,71,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)", fontSize: "10px",
                      color: "var(--text-muted)", padding: "3px 8px",
                      borderRadius: "6px", background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    default
                  </span>
                )}
              </div>

              {deleteError[cat.id] && (
                <p
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    color: "#ff6b47", marginTop: "6px", paddingLeft: "14px",
                  }}
                >
                  {deleteError[cat.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Appearance ─────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Appearance</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { value: "dark",  label: "Dark",  sub: "Easy on the eyes" },
            { value: "light", label: "Light", sub: "Clean and bright"  },
          ].map((t) => {
            const active = mounted ? theme === t.value : t.value === "dark";
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value as "dark" | "light")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
                  transition: "all 0.2s", width: "100%", textAlign: "left",
                  border: `1px solid ${active ? "rgba(232,255,71,0.3)" : "var(--border)"}`,
                  background: active ? "rgba(232,255,71,0.05)" : "transparent",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                    {t.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    {t.sub}
                  </p>
                </div>
                {active && (
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e8ff47", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Account ────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Account</p>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--border)",
            background: "transparent", cursor: "pointer", transition: "all 0.2s",
            width: "100%", textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>Sign Out</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Sign out of your Spendly account</p>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>→</span>
        </button>
      </div>

      {/* ── Danger Zone ────────────────────────────────────────── */}
      <div style={{ ...sectionStyle, border: "1px solid rgba(255,107,71,0.2)" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, color: "#ff6b47", letterSpacing: "-0.02em", marginBottom: "8px" }}>
          Danger Zone
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
          These actions are permanent and cannot be undone.
        </p>
        <button
          style={{
            padding: "10px 20px", borderRadius: "10px",
            border: "1px solid rgba(255,107,71,0.3)", background: "rgba(255,107,71,0.1)",
            color: "#ff6b47", fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "13px", cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,71,0.2)"; e.currentTarget.style.borderColor = "rgba(255,107,71,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,107,71,0.1)"; e.currentTarget.style.borderColor = "rgba(255,107,71,0.3)"; }}
        >
          Delete All Data
        </button>
      </div>

      {/* ── Create Category Modal ───────────────────────────────── */}
      {showCatModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "100%", maxWidth: "400px", borderRadius: "20px",
              padding: "28px", background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                New Category
              </h2>
              <button
                onClick={() => { setShowCatModal(false); setCatName(""); setCatError(""); }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Preview */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "16px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <CategoryIcon name={catName || "?"} color={catColor} size="lg" />
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "#fff", marginBottom: "2px" }}>
                    {catName || "Category Name"}
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    Preview
                  </p>
                </div>
              </div>

              {/* Name input */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Category Name
                </label>
                <input
                  placeholder="e.g. Vacation, Gym, Pets..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
                    padding: "10px 14px", color: "#fff", caretColor: "#fff",
                    WebkitTextFillColor: "#fff", fontFamily: "var(--font-mono)",
                    fontSize: "13px", outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(232,255,71,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              {/* Color picker */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                  Color
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCatColor(c)}
                      style={{
                        width: "100%", aspectRatio: "1", borderRadius: "8px",
                        background: c, border: catColor === c
                          ? "2px solid #fff"
                          : "2px solid transparent",
                        cursor: "pointer", transition: "transform 0.15s",
                        transform: catColor === c ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {catError && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ff6b47" }}>
                  {catError}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleCreateCategory}
                disabled={isPending}
                style={{
                  width: "100%", padding: "13px", borderRadius: "12px",
                  border: "none", background: "#e8ff47", color: "#080808",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s",
                }}
              >
                {isPending ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}