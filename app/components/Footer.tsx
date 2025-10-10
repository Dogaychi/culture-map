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
        <a href="/terms" style={{ marginLeft: 4, color: "#000", textDecoration: "underline" }}>Terms</a> • 
        <a href="/privacy" style={{ marginLeft: 4, color: "#000", textDecoration: "underline" }}>Privacy</a> • 
        <a href="/cookies" style={{ marginLeft: 4, color: "#000", textDecoration: "underline" }}>Cookies</a>
      </div>
    </footer>
  );
}
