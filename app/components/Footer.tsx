export default function Footer() {
  return (
    <footer
      style={{
        background: "#fff",
        color: "#000",
        fontFamily: "Space Mono, monospace",
        fontSize: "10px",
        borderTop: "1px solid #000",
        textAlign: "center",
        padding: "4px 0",
        letterSpacing: "0.5px",
      }}
    >
      <div>
        © {new Date().getFullYear()} Countercult Creatives • 
        <a href="https://countercultcreatives.com/terms-and-conditions/" style={{ marginLeft: 4, color: "#000", textDecoration: "underline" }}>Terms</a> • 
        <a href="https://countercultcreatives.com/privacy-policy/" style={{ marginLeft: 4, color: "#000", textDecoration: "underline" }}>Privacy</a> • 
        <a href="https://countercultcreatives.com/cookie-policy/" style={{ marginLeft: 4, color: "#000", textDecoration: "underline" }}>Cookies</a>
      </div>
    </footer>
  );
}
