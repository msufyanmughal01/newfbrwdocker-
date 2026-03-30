"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#f0f5ff",
    border: "1.5px solid #dbeafe",
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "14px",
    color: "#0f172a",
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

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = "#1d4ed8";
    e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.12)";
    e.target.style.background = "#ffffff";
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = "#dbeafe";
    e.target.style.boxShadow = "none";
    e.target.style.background = "#f0f5ff";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, businessName, email, phone, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
      setName(""); setBusinessName(""); setEmail(""); setPhone(""); setMessage("");
    } catch {
      setError("Failed to send. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontWeight: 800, fontSize: "20px", color: "#0f172a", marginBottom: "8px" }}>
          Message Sent!
        </p>
        <p style={{ color: "#64748b", fontSize: "15px" }}>
          We will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Ahmad Khan" />
        </div>
        <div>
          <label style={labelStyle}>Business Name *</label>
          <input type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)}
            style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="Khan Enterprises" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="ahmad@business.pk" />
        </div>
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="+92 300 0000000" />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={labelStyle}>Message</label>
        <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Tell us about your business..."
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={handleFocus} onBlur={handleBlur}
        />
      </div>

      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px",
          padding: "10px 14px", marginBottom: "16px", fontSize: "14px", color: "#dc2626"
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          background: loading ? "#93c5fd" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
          color: "white",
          padding: "14px",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          border: "none",
          boxShadow: loading ? "none" : "0 4px 16px rgba(29,78,216,0.3)",
          transition: "all 0.2s",
          letterSpacing: "0.01em",
        }}
      >
        {loading ? "Sending..." : "Send Message →"}
      </button>
    </form>
  );
}
