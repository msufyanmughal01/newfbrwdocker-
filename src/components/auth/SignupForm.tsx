"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { SocialLoginButton } from "./SocialLoginButton";

// Map better-auth error codes / messages to user-friendly text
function mapSignupError(message?: string | null, status?: number, code?: string | null): string {
  if (!message && !code) return "Could not create account. Please try again.";

  // HIBP breach check returns a specific code
  if (code === "PASSWORD_BREACHED" || (message && message.includes("known data breaches")))
    return message ?? "This password has appeared in known data breaches. Please choose a different password.";

  const msg = (message ?? "").toLowerCase();

  // Duplicate email — better-auth may return 409 or 422
  if (msg.includes("already exists") || msg.includes("user already") || status === 409 || status === 422)
    return "An account with this email already exists. Please sign in instead.";

  if (msg.includes("password") && (msg.includes("short") || msg.includes("least") || msg.includes("minimum")))
    return "Password must be at least 8 characters.";

  if (msg.includes("invalid email") || msg.includes("email is invalid"))
    return "Please enter a valid email address.";

  return message ?? "Could not create account. Please try again.";
}

// Simple password strength: 0 = weak, 1 = fair, 2 = strong
function getPasswordStrength(pw: string): 0 | 1 | 2 {
  if (pw.length < 8) return 0;
  const hasUpper  = /[A-Z]/.test(pw);
  const hasLower  = /[a-z]/.test(pw);
  const hasDigit  = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  if (pw.length >= 12 && score >= 3) return 2;
  if (pw.length >= 8  && score >= 2) return 1;
  return 0;
}

const STRENGTH_LABEL = ["Weak", "Fair", "Strong"] as const;
const STRENGTH_COLOR = ["#dc2626", "#f59e0b", "#16a34a"] as const;

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        const code = (result.error as { code?: string }).code ?? null;
        setError(mapSignupError(result.error.message, result.error.status, code));
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429) {
        setError("Too many attempts. Please wait a minute and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1.5px solid #dbeafe",
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "16px",
    color: "#0f172a",
    background: "#f8faff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#1e3a8a",
    marginBottom: "6px",
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "8px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
          Create your account
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Start generating FBR-compliant invoices today
        </p>
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Full Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your full name"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#dbeafe"; e.target.style.boxShadow = "none"; e.target.style.background = "#f8faff"; }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@business.pk"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#dbeafe"; e.target.style.boxShadow = "none"; e.target.style.background = "#f8faff"; }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            style={{ ...inputStyle, paddingRight: "44px" }}
            onFocus={e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; e.target.style.background = "#fff"; }}
            onBlur={e => { e.target.style.borderColor = "#dbeafe"; e.target.style.boxShadow = "none"; e.target.style.background = "#f8faff"; }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "2px", fontSize: "16px" }}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>

        {/* Password strength bar — only shown while typing */}
        {password.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: "4px", borderRadius: "2px",
                    background: i <= strength ? STRENGTH_COLOR[strength] : "#e2e8f0",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: "11px", color: STRENGTH_COLOR[strength], margin: 0, fontWeight: 600 }}>
              {STRENGTH_LABEL[strength]} password
              {strength === 0 && " — add uppercase, numbers or symbols"}
              {strength === 1 && " — add more variety to make it stronger"}
            </p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Confirm Password</label>
        <input
          type={showPassword ? "text" : "password"}
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          style={{
            ...inputStyle,
            borderColor: confirmPassword && confirmPassword !== password ? "#fca5a5" : "#dbeafe",
          }}
          onFocus={e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; e.target.style.background = "#fff"; }}
          onBlur={e => {
            e.target.style.borderColor = confirmPassword && confirmPassword !== password ? "#fca5a5" : "#dbeafe";
            e.target.style.boxShadow = "none"; e.target.style.background = "#f8faff";
          }}
        />
        {confirmPassword && confirmPassword !== password && (
          <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px", margin: "4px 0 0" }}>
            Passwords do not match
          </p>
        )}
      </div>

      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "8px", padding: "10px 14px",
          marginBottom: "16px", fontSize: "13px", color: "#dc2626",
          display: "flex", alignItems: "flex-start", gap: "8px",
        }}>
          <span style={{ flexShrink: 0, marginTop: "1px" }}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          background: loading ? "#93c5fd" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
          color: "white", border: "none", borderRadius: "10px",
          padding: "13px", fontSize: "15px", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 14px rgba(29,78,216,0.3)",
          transition: "all 0.2s", letterSpacing: "0.01em",
        }}
      >
        {loading ? "Creating account..." : "Create Account →"}
      </button>

      <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        <span style={{ padding: "0 12px", fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
      </div>

      <SocialLoginButton />

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
