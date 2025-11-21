"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AdminLogin() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "Space Mono, monospace" }}>Loading…</div>}>
      <AdminLoginInner />
    </Suspense>
  );
}

function AdminLoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        router.replace("/admin");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    const redirect = search.get("redirect") || "/admin";
    router.replace(redirect);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#111", color: "#000", fontFamily: "Space Mono, monospace", textTransform: "uppercase"
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 360, background: "#fff", border: "2px solid #000", borderRadius: 18,
        padding: 24, boxShadow: "0 6px 0 #000", display: "grid", gap: 16
      }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Admin Login</h1>
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ border: "2px solid #000", padding: "12px 14px", borderRadius: 12 }}
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ border: "2px solid #000", padding: "12px 14px", borderRadius: 12 }}
        />
        {error && <div style={{ color: "#c00", fontSize: 12 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            border: "2px solid #000",
            background: "#D7FF3A",
            borderRadius: 9999,
            padding: "14px 18px",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

