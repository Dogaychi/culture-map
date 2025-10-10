export default function CookiesPage() {
  return (
    <div style={{
      background: "#000",
      color: "#fff",
      padding: "60px 20px",
      maxWidth: 900,
      margin: "0 auto",
      fontFamily: "Space Mono, monospace",
      lineHeight: 1.7,
    }}>
      <h1 style={{ textTransform: "uppercase", fontSize: 22, fontWeight: 900, marginBottom: 20, color: "#D7FF3A" }}>
        Cookie Policy — Countercult Creatives
      </h1>
      <p><strong>Last updated:</strong> October 2025</p>

      <p>
        We use cookies and similar technologies to operate this site, maintain basic functionality, and analyze cultural
        engagement. With consent, analytics and partner cookies may also be used for insight generation or sponsored
        content tracking.
      </p>

      <h2 style={{ color: "#D7FF3A" }}>1. Types of Cookies</h2>
      <ul>
        <li><strong>Essential:</strong> Required for security, submission storage, and map functionality.</li>
        <li><strong>Analytics (consent):</strong> Measure cultural engagement and platform use.</li>
        <li><strong>Advertising (future, consent):</strong> Track sponsored content or brand collaborations.</li>
      </ul>

      <h2 style={{ color: "#D7FF3A" }}>2. Your Choices</h2>
      <p>
        You can manage cookies through your browser or use the site prompt to select essential-only mode.
      </p>

      <h2 style={{ color: "#D7FF3A" }}>3. Contact</h2>
      <p>
        Questions? <a href="mailto:howdy@countercultcreatives.com" style={{ color: "#D7FF3A" }}>howdy@countercultcreatives.com</a>
      </p>
    </div>
  );
}
