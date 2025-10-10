"use client";
export default function TermsPage() {
  return (
    <div style={{ padding: 40, fontFamily: "Space Mono, monospace", lineHeight: 1.6, maxWidth: 900 }}>
      <h1 style={{ textTransform: "uppercase", fontWeight: 900, marginBottom: 10 }}>Terms & Conditions</h1>
      <p>Last updated: October 2025</p>
      <p>
        This website (“Culture Explorer”) is operated by Countercult Creatives (“we”, “our”, “us”).
        By using this website you agree to comply with these Terms.
      </p>
      <ul>
        <li>Users are responsible for the accuracy of submissions.</li>
        <li>We reserve the right to edit, remove, or moderate any content.</li>
        <li>We do not guarantee the accuracy or availability of the information displayed.</li>
        <li>We may update these Terms at any time; continued use means acceptance.</li>
      </ul>
      <p>Contact: <a href="mailto:hello@countercult.xyz">hello@countercult.xyz</a></p>
    </div>
  );
}
