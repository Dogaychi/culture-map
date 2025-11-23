"use client";
export default function LegalFooter() {
  return (
    <footer style={{
      marginTop: 40, paddingTop: 20, borderTop: "1px solid #000",
      fontFamily: "Space Mono, monospace", fontSize: 12, color: "#555", textTransform: "uppercase"
    }}>
      <a href="https://countercultcreatives.com/terms-and-conditions/" style={{ marginRight: 16, color: "#000", textDecoration: "underline" }}>Terms</a>
      <a href="https://countercultcreatives.com/privacy-policy/" style={{ marginRight: 16, color: "#000", textDecoration: "underline" }}>Privacy</a>
      <a href="https://countercultcreatives.com/cookie-policy/" style={{ color: "#000", textDecoration: "underline" }}>Cookies</a>
      <div style={{ marginTop: 8 }}>© {new Date().getFullYear()} Countercult Creatives</div>
    </footer>
  );
}
