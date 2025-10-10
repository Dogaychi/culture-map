"use client";
export default function PrivacyPage() {
  return (
    <div style={{ padding: 40, fontFamily: "Space Mono, monospace", lineHeight: 1.6, maxWidth: 900 }}>
      <h1 style={{ textTransform: "uppercase", fontWeight: 900, marginBottom: 10 }}>Privacy Policy</h1>
      <p>Last updated: October 2025</p>
      <h3 style={{ marginTop: 16 }}>Data We Collect</h3>
      <ul>
        <li>Submission details (title, description, location, uploaded media)</li>
        <li>Optional contact information if you claim a listing</li>
        <li>Basic analytics (page views, browser type, approximate location)</li>
      </ul>
      <h3 style={{ marginTop: 16 }}>How We Use It</h3>
      <ul>
        <li>To display cultural submissions on our map</li>
        <li>To moderate and verify submitted content</li>
        <li>To improve website experience</li>
      </ul>
      <p>
        We do not sell personal data. You can request deletion via{" "}
        <a href="mailto:hello@countercult.xyz">hello@countercult.xyz</a>.
      </p>
    </div>
  );
}
