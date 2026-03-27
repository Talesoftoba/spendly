"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/lib/actions";

type FormKey = "name" | "email" | "password";

const fields: {
  key: FormKey;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
}[] = [
  {
    key: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Sam Toba",
    autoComplete: "name",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    autoComplete: "email",
  },
  {
    key: "password",
    label: "Password",
    type: "password",
    placeholder: "Min. 8 characters",
    autoComplete: "new-password",
  },
];

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<Record<FormKey, string>>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (key: FormKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    const result = await registerUser(form);

    if ("error" in result && result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/dashboard");
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
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "var(--bg-base)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #e8ff47, #47ffe8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "20px",
              color: "#080808",
              margin: "0 auto 16px",
            }}
          >
            S
          </div>
          <h1
            style={{
              fontFamily: "(--font-display)",
              fontSize: "24px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              marginBottom: "6px",
            }}
          >
            Create account
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Start tracking with Spendly
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {fields.map(({ key, label, type, placeholder, autoComplete }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{
                  ...inputStyle,
                  ...(errors[key]
                    ? { borderColor: "rgba(255,107,71,0.5)" }
                    : {}),
                }}
                onFocus={(e) => {
                  if (!errors[key]) {
                    e.target.style.borderColor = "rgba(232,255,71,0.5)";
                  }
                }}
                onBlur={(e) => {
                  if (!errors[key]) {
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  }
                }}
              />
              {errors[key] && (
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "#ff6b47",
                    marginTop: "6px",
                  }}
                >
                  {errors[key][0]}
                </p>
              )}
            </div>
          ))}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "12px",
              border: "none",
              background: "#e8ff47",
              color: "#080808",
              fontFamily: "(--font-display)",
              fontWeight: 700,
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
              marginTop: "4px",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          {/* Login link */}
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/auth/login"
              style={{ color: "#e8ff47", textDecoration: "none" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}