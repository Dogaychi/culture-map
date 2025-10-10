"use client";
import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const ok = localStorage.getItem("cookieConsent");
      if (!ok) setShow(true);
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      background: "#000", color: "#fff", padding: "14px 18px", borderRadius: 12,
      fontFamily: "Space Mono, monospace", fontSize: 12, zIndex: 9999, border: "2px solid #000"
    }}>
      We use minimal cookies to improve your experience.{" "}
      <a href="/cookies" style={{ color: "#D7FF3A", textDecoration: "underline" }}>Learn more</a>.
      <button
        onClick={() => { try { localStorage.setItem("cookieConsent", "true"); } catch {}; setShow(false); }}
        style={{
          marginLeft: 10, border: "2px solid #D7FF3A", background: "#D7FF3A", color: "#000",
          fontWeight: 800, borderRadius: 9999, padding: "6px 12px", cursor: "pointer", textTransform: "uppercase"
        }}
      >
        OK
      </button>
    </div>
  );
}
