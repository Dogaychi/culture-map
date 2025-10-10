"use client";
import { useEffect, useState } from "react";

/**
 * CookieConsentModal
 * - Shows once to new visitors (until accepted/essential-only is stored).
 * - Accept: stores "accepted"
 * - Essential only: stores "essential" (no analytics should fire in this mode)
 * - You can gate any analytics init based on this flag elsewhere in your app.
 */
export default function CookieConsentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("cookieConsent");
      if (!v) setOpen(true);
    } catch {}
  }, []);

  if (!open) return null;

  const acceptAll = () => {
    try { localStorage.setItem("cookieConsent", "accepted"); } catch {}
    setOpen(false);
  };

  const essentialOnly = () => {
    try { localStorage.setItem("cookieConsent", "essential"); } catch {}
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          width: "min(560px, 92vw)",
          background: "#fff",
          color: "#000",
          border: "2px solid #000",
          borderRadius: 16,
          boxShadow: "0 8px 0 #000",
          padding: 20,
          fontFamily: "Space Mono, monospace",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 10, textTransform: "uppercase", fontWeight: 900 }}>
          Cookies & Data Use
        </h2>
        <p style={{ fontSize: 12, lineHeight: 1.6 }}>
          We use essential cookies and store submitted data to run Culture Explorer. With your consent, we may also
          use analytics and (in the future) show sponsored content. We analyze submissions to document culture and
          support trend forecasting. See our{" "}
          <a href="/privacy" style={{ color: "#000", textDecoration: "underline" }}>Privacy Policy</a> and{" "}
          <a href="/cookies" style={{ color: "#000", textDecoration: "underline" }}>Cookie Policy</a>.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button
            onClick={acceptAll}
            style={{
              border: "2px solid #000",
              background: "#D7FF3A",
              color: "#000",
              borderRadius: 9999,
              padding: "10px 14px",
              fontWeight: 800,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Accept All
          </button>
          <button
            onClick={essentialOnly}
            style={{
              border: "2px solid #000",
              background: "#fff",
              color: "#000",
              borderRadius: 9999,
              padding: "10px 14px",
              fontWeight: 800,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Essential Only
          </button>
          <a
            href="/cookies"
            style={{
              marginLeft: "auto",
              alignSelf: "center",
              color: "#000",
              textDecoration: "underline",
              fontSize: 12,
            }}
          >
            Learn More →
          </a>
        </div>
      </div>
    </div>
  );
}
