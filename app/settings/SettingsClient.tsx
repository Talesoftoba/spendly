"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "../components/layout/ThemeProvider";
import { useCurrency } from "../components/layout/CurrencyProvider";
import { updateProfile, createCategory, deleteCategory, removeAvatar } from "../lib/actions";
import { CategoryIcon } from "../components/ui/CategoryIcon";
import { Plus, X, Trash2, User, Tag, Palette, LogOut, AlertTriangle, ChevronRight } from "lucide-react";
import type { Category } from "@/types";
import Image from "next/image";

type Props = {
  categories: Category[];
  savedName: string;
  savedCurrency: string;
};

const PRESET_COLORS = [
  "#e8ff47", "#47ffe8", "#ff6b47", "#a847ff",
  "#4778ff", "#ff47a8", "#47ff78", "#ffb347",
  "#ff4747", "#47d4ff", "#c847ff", "#ff8c47",
];

const DEFAULT_CATEGORIES = ["Housing", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Income"];

const NAV_ITEMS = [
  { id: "profile",    label: "Profile",     icon: User },
  { id: "categories", label: "Categories",  icon: Tag },
  { id: "appearance", label: "Appearance",  icon: Palette },
  { id: "account",    label: "Account",     icon: LogOut },
  { id: "danger",     label: "Danger Zone", icon: AlertTriangle, danger: true },
];

export function SettingsClient({
  categories: initialCategories,
  savedName,
  savedCurrency,
}: Props) {
  const { data: session, update, status } = useSession();
  const { theme, setTheme } = useTheme();
  const { setCurrency: updateCurrency } = useCurrency();

  const [activeSection, setActiveSection] = useState("profile");
  const [name, setName]           = useState(savedName);
  const [currency, setCurrency]   = useState(savedCurrency);
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [mounted, setMounted]     = useState(false);
  const mountedRef                = useRef(false);

  const [avatarUrl, setAvatarUrl]     = useState<string | null | undefined>(undefined);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const imageSrc = avatarUrl ?? session?.user?.avatarUrl ?? null;

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
      setAvatarUrl(session?.user?.avatarUrl ?? null);
    });
  }, [session?.user?.avatarUrl]);

  const handleSave = async () => {
    if (!name.trim()) { setSaveError("Name cannot be empty"); return; }
    setSaving(true); setSaveError("");
    try {
      const result = await updateProfile({ name: name.trim(), currency });
      if ("error" in result) { setSaveError("Failed to save. Please try again."); setSaving(false); return; }
      updateCurrency(currency);
      await update({ name: name.trim() });
      setSaving(false); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError("");
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Upload failed"); setUploading(false); return; }
      setAvatarUrl(data.avatarUrl);
      await update({ avatarUrl: data.avatarUrl });
      setUploading(false);
    } catch {
      setUploadError("Something went wrong");
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    await removeAvatar();
    setAvatarUrl("");
    await update({ avatarUrl: null });
  };

  const handleCreateCategory = () => {
    if (!catName.trim()) { setCatError("Name is required"); return; }
    setCatError("");
    startTransition(async () => {
      const result = await createCategory({ name: catName.trim(), color: catColor });
      if ("error" in result) {
        const err = result.error;
        if (typeof err === "object" && err !== null && "name" in err) {
          setCatError((err as Record<string, string[]>).name[0]);
        } else { setCatError("Something went wrong"); }
        return;
      }
      if ("category" in result && result.category) {
        setCategories((prev) => [...prev, result.category as Category]);
      }
      setShowCatModal(false); setCatName(""); setCatColor("#e8ff47");
    });
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteError((prev) => ({ ...prev, [id]: "" }));
    startTransition(async () => {
      const result = await deleteCategory(id);
      if ("error" in result) {
        setDeleteError((prev) => ({
          ...prev,
          [id]: typeof result.error === "string" ? result.error : "Cannot delete this category",
        }));
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "var(--text-primary)",
    caretColor: "var(--text-primary)",
    WebkitTextFillColor: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: "7px",
  };

  return (
    <>
   
   <style>{`
  .sc-shell { width: 100%; display: flex; justify-content: center; }
  .sc-inner { width: 100%; max-width: 900px; display: flex; gap: 24px; align-items: flex-start; }
  .sc-sidebar {
    width: 220px; flex-shrink: 0; border-radius: 16px;
    background: var(--bg-card); border: 1px solid var(--border);
    padding: 8px; position: sticky; top: 20px;
  }
  .sc-sidebar-nav { display: flex; flex-direction: column; }
  .sc-content { flex: 1; min-width: 0; }
  .sc-panel { border-radius: 16px; padding: 32px; background: var(--bg-card); border: 1px solid var(--border); }
  .sc-panel-danger { border-color: rgba(255,107,71,0.2) !important; }
  .sc-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sc-cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .sc-appear-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .sc-avatar-row { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); margin-bottom: 24px; }
  .sc-action-row { display: flex; align-items: center; justify-content: space-between; }
  .sc-save-row { display: flex; justify-content: flex-end; padding-top: 4px; }

  @media (max-width: 640px) {
    .sc-inner {
      flex-direction: column;
      gap: 10px;
      padding: 0 12px;
    }

    /* Sidebar → horizontal scroll pills */
    .sc-sidebar {
      width: 100%;
      position: static;
      border-radius: 12px;
      margin-bottom: 6px;
      padding: 6px;
      overflow: hidden;
    }

    .sc-sidebar-identity { display: none !important; }

   .sc-sidebar-nav {
  flex-direction: row !important;
  overflow-x: auto;
  gap: 6px;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 6px;
}

/* Show subtle scrollbar so users know it scrolls */
.sc-sidebar-nav {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

/* Make buttons fill grid nicely */
.sc-nav-btn {
  width: 100% !important;
  justify-content: center !important;
  text-align: center !important;
  padding: 10px !important;
  border-radius: 10px !important;
}

/* Hide arrow */
.sc-nav-chevron {
  display: none !important;
}

    /* Panels tighter + safer spacing */
    .sc-panel {
      padding: 16px !important;
      border-radius: 12px !important;
    }

    /* Prevent overflow issues */
    .sc-content {
      width: 100%;
      overflow-x: hidden;
    }

    /* Grids → single column */
    .sc-profile-grid,
    .sc-cat-grid,
    .sc-appear-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    /* Avatar → cleaner stacking */
    .sc-avatar-row {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 12px !important;
      padding: 14px !important;
    }

    /* Buttons full width */
    .sc-save-row {
      justify-content: stretch !important;
    }

    .sc-save-btn {
      width: 100% !important;
    }

    /* Action rows stack better */
    .sc-action-row {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
    }

    .sc-action-btn {
      width: 100% !important;
      margin-left: 0 !important;
    }

    /* Category items spacing */
    .sc-cat-grid > div > div {
      padding: 10px 12px !important;
    }

    /* Modal improvements */
    .sc-modal {
      padding: 12px !important;
    }

    /* Inputs feel less cramped */
    input, select {
      font-size: 14px !important;
      padding: 12px 14px !important;
    }
  }
`}</style>

      <div className="sc-shell animate-fade-up">
        <div className="sc-inner">

          {/* ── Sidebar ── */}
          <div className="sc-sidebar">
            <div className="sc-sidebar-identity" style={{ padding: "16px 12px 20px", borderBottom: "1px solid var(--border)", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
                  {status === "loading" ? (
                    <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.06)" }} />
                  ) : imageSrc ? (
                    <Image src={imageSrc} alt="Avatar" width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e8ff47, #47ffe8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "#080808" }}>
                      {name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                    {name || session?.user?.name || "User"}
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                    {session?.user?.email ?? ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="sc-sidebar-nav">
              {NAV_ITEMS.map(({ id, label, icon: Icon, danger }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className="sc-nav-btn"
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "9px",
                      padding: "9px 12px", borderRadius: "9px", border: "none",
                      background: active ? (danger ? "rgba(255,107,71,0.1)" : "rgba(232,255,71,0.1)") : "transparent",
                      color: active ? (danger ? "#ff6b47" : "#e8ff47") : danger ? "#ff6b47" : "var(--text-muted)",
                      cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                      marginBottom: "2px",
                      marginTop: danger ? "4px" : "0",
                      borderTop: danger ? "1px solid var(--border)" : "none",
                      paddingTop: danger ? "13px" : "9px",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = danger ? "rgba(255,107,71,0.06)" : "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = danger ? "#ff6b47" : "var(--text-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = danger ? "#ff6b47" : "var(--text-muted)";
                      }
                    }}
                  >
                    <Icon size={14} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: active ? 700 : 500, flex: 1 }}>{label}</span>
                    <ChevronRight size={12} className="sc-nav-chevron" style={{ flexShrink: 0, opacity: active ? 0.5 : 0 }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="sc-content">

            {/* Profile */}
            {activeSection === "profile" && (
              <div className="sc-panel">
                <div style={{ marginBottom: "28px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Settings</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Profile</p>
                </div>

                <div className="sc-avatar-row">
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {status === "loading" ? (
                      <div style={{ width: "72px", height: "72px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", border: "2px solid var(--border)" }} />
                    ) : imageSrc ? (
                      <Image src={imageSrc} alt="Avatar" width={72} height={72} loading="eager" priority
                        style={{ width: "72px", height: "72px", borderRadius: "16px", objectFit: "cover", border: "2px solid var(--border)", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "72px", height: "72px", borderRadius: "16px", background: "linear-gradient(135deg, #e8ff47, #47ffe8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "#080808" }}>
                        {name?.[0]?.toUpperCase() ?? session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <label htmlFor="avatar-upload"
                      style={{ position: "absolute", bottom: "-6px", right: "-6px", width: "24px", height: "24px", borderRadius: "8px", background: "#e8ff47", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer", border: "2px solid var(--bg-card)", transition: "opacity 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </label>
                    <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={handleAvatarUpload} style={{ display: "none" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", marginBottom: "3px" }}>{name || session?.user?.name || "User"}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>{session?.user?.email ?? ""}</p>
                    {uploading && <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#47ffe8" }}>Uploading...</p>}
                    {uploadError && <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#ff6b47" }}>{uploadError}</p>}
                    {!uploading && !uploadError && (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Click icon to upload photo</p>
                        {imageSrc && (
                          <button onClick={handleRemoveAvatar} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#ff6b47", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: "2px" }}>
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div className="sc-profile-grid">
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "rgba(232,255,71,0.4)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Currency</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="USD">USD ($) — US Dollar</option>
                        <option value="EUR">EUR (€) — Euro</option>
                        <option value="GBP">GBP (£) — British Pound</option>
                        <option value="NGN">NGN (₦) — Nigerian Naira</option>
                        <option value="CAD">CAD ($) — Canadian Dollar</option>
                        <option value="AUD">AUD ($) — Australian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={session?.user?.email ?? ""} type="email" readOnly style={{ ...inputStyle, opacity: 0.45, cursor: "not-allowed" }} />
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "5px" }}>Email cannot be changed</p>
                  </div>

                  {saveError && (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ff6b47", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,107,71,0.08)", border: "1px solid rgba(255,107,71,0.2)" }}>
                      {saveError}
                    </p>
                  )}

                  <div className="sc-save-row">
                    <button className="sc-save-btn" onClick={handleSave} disabled={saving}
                      style={{ padding: "10px 28px", borderRadius: "10px", border: "none", background: saved ? "rgba(71,255,232,0.15)" : "#e8ff47", color: saved ? "#47ffe8" : "#080808", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, transition: "all 0.3s", boxSizing: "border-box" }}
                    >
                      {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            {activeSection === "categories" && (
              <div className="sc-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", gap: "12px" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Settings</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Categories</p>
                  </div>
                  <button
                    onClick={() => setShowCatModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "10px", border: "none", background: "#e8ff47", color: "#080808", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "12px", cursor: "pointer", transition: "opacity 0.2s", flexShrink: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <Plus size={13} /> New
                  </button>
                </div>
                <div className="sc-cat-grid">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "11px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", transition: "border-color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        <CategoryIcon name={cat.name} color={cat.color} size="sm" />
                        <p style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</p>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                        {!DEFAULT_CATEGORIES.includes(cat.name) ? (
                          <button onClick={() => handleDeleteCategory(cat.id)} disabled={isPending}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: isPending ? "not-allowed" : "pointer", padding: "3px", borderRadius: "5px", display: "flex", alignItems: "center", transition: "all 0.2s", marginLeft: "2px" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#ff6b47"; e.currentTarget.style.background = "rgba(255,107,71,0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", marginLeft: "2px", whiteSpace: "nowrap" }}>
                            default
                          </span>
                        )}
                      </div>
                      {deleteError[cat.id] && (
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#ff6b47", marginTop: "4px", paddingLeft: "4px" }}>{deleteError[cat.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === "appearance" && (
              <div className="sc-panel">
                <div style={{ marginBottom: "28px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Settings</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Appearance</p>
                </div>
                <div className="sc-appear-grid">
                  {[
                    { value: "dark",  label: "Dark",  sub: "Easy on the eyes", preview: ["#0a0a0a", "#141414", "#1a1a1a"] },
                    { value: "light", label: "Light", sub: "Clean and bright",  preview: ["#ffffff", "#f0f0f0", "#e8e8e8"] },
                  ].map((t) => {
                    const active = mounted ? theme === t.value : t.value === "dark";
                    return (
                      <button key={t.value} onClick={() => setTheme(t.value as "dark" | "light")}
                        style={{ display: "flex", flexDirection: "column", padding: "20px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s", textAlign: "left", border: `1px solid ${active ? "rgba(232,255,71,0.35)" : "var(--border)"}`, background: active ? "rgba(232,255,71,0.05)" : "rgba(255,255,255,0.02)", width: "100%", boxSizing: "border-box" }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--border)"; }}
                      >
                        <div style={{ width: "100%", height: "64px", borderRadius: "8px", marginBottom: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "4px", padding: "8px", background: t.preview[0], boxSizing: "border-box" }}>
                          <div style={{ height: "8px", borderRadius: "3px", background: t.preview[1], width: "60%" }} />
                          <div style={{ height: "8px", borderRadius: "3px", background: t.preview[2], width: "80%" }} />
                          <div style={{ height: "8px", borderRadius: "3px", background: t.preview[1], width: "40%" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{t.label}</p>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{t.sub}</p>
                          </div>
                          {active && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e8ff47", flexShrink: 0 }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account */}
            {activeSection === "account" && (
              <div className="sc-panel">
                <div style={{ marginBottom: "28px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Settings</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Account</p>
                </div>
                <div className="sc-action-row" style={{ padding: "20px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px" }}>Sign Out</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Sign out of your Spendly account</p>
                  </div>
                  <button
                    className="sc-action-btn"
                    onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    style={{ padding: "9px 20px", borderRadius: "9px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.2s", flexShrink: 0, marginLeft: "16px", boxSizing: "border-box" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,71,0.08)"; e.currentTarget.style.borderColor = "rgba(255,107,71,0.3)"; e.currentTarget.style.color = "#ff6b47"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeSection === "danger" && (
              <div className="sc-panel sc-panel-danger">
                <div style={{ marginBottom: "28px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "rgba(255,107,71,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Settings</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "#ff6b47", letterSpacing: "-0.03em" }}>Danger Zone</p>
                </div>
                <div className="sc-action-row" style={{ padding: "20px", borderRadius: "12px", background: "rgba(255,107,71,0.04)", border: "1px solid rgba(255,107,71,0.15)" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px" }}>Delete All Data</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Permanently erase all transactions, budgets, and categories</p>
                  </div>
                  <button
                    className="sc-action-btn"
                    style={{ padding: "9px 20px", borderRadius: "9px", border: "1px solid rgba(255,107,71,0.3)", background: "rgba(255,107,71,0.1)", color: "#ff6b47", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.2s", flexShrink: 0, marginLeft: "16px", boxSizing: "border-box" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,71,0.2)"; e.currentTarget.style.borderColor = "rgba(255,107,71,0.5)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,107,71,0.1)"; e.currentTarget.style.borderColor = "rgba(255,107,71,0.3)"; }}
                  >
                    Delete All Data
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Category Modal */}
        {showCatModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <div style={{ width: "100%", maxWidth: "400px", borderRadius: "20px", padding: "28px", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>New Category</h2>
                <button onClick={() => { setShowCatModal(false); setCatName(""); setCatError(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <CategoryIcon name={catName || "?"} color={catColor} size="lg" />
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "#fff", marginBottom: "2px" }}>{catName || "Category Name"}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Preview</p>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Category Name</label>
                  <input placeholder="e.g. Vacation, Gym, Pets..." value={catName} onChange={(e) => setCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "#fff", caretColor: "#fff", WebkitTextFillColor: "#fff", fontFamily: "var(--font-mono)", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(232,255,71,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Color</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                    {PRESET_COLORS.map((c) => (
                      <button key={c} onClick={() => setCatColor(c)}
                        style={{ width: "100%", aspectRatio: "1", borderRadius: "8px", background: c, border: catColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", transition: "transform 0.15s", transform: catColor === c ? "scale(1.15)" : "scale(1)" }}
                      />
                    ))}
                  </div>
                </div>
                {catError && <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ff6b47" }}>{catError}</p>}
                <button onClick={handleCreateCategory} disabled={isPending}
                  style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "#e8ff47", color: "#080808", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}
                >
                  {isPending ? "Creating..." : "Create Category"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}