// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

function RelCard({ e }: { e: any }) {
  return (
    <a
      href={`/entry/${e.id}`}
      style={{
        background: "#fff",
        border: "2px solid #000",
        borderRadius: 12,
        boxShadow: "0 4px 0 #000",
        color: "#000",
        textDecoration: "none",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 260,
      }}
    >
      <div
        style={{
          height: 130,
          background: "#eee",
          borderBottom: "2px solid #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {e.photo_url ? (
          <img
            src={e.photo_url}
            alt={e.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ fontSize: 12, color: "#666" }}>NO IMAGE</div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14 }}>{e.title}</div>
        {e.community && (
          <div style={{ color: "#333", fontStyle: "italic", fontSize: 12, marginBottom: 6 }}>
            {e.community}
          </div>
        )}
        <div style={{ color: "#444", fontSize: 12 }}>
          {(e.type || "artist")} • {e.city ? e.city + ", " : ""}{e.country} {e.zipcode}
        </div>
      </div>
    </a>
  );
}

export default function EntryDetails({ params }: { params: { id: string } }) {
  const [row, setRow] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const id = Number(params.id);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("entries").select("*").eq("id", id).single();
      if (!active) return;
      if (error) { setErr(error.message); return; }
      setRow(data);

      // Related: prefer same community, else same country, else recent
      try {
        let rel: any[] = [];
        if (data?.community) {
          const { data: d1 } = await supabase
            .from("entries")
            .select("id,title,photo_url,community,country,zipcode,type")
            .eq("community", data.community)
            .neq("id", id)
            .limit(8);
          rel = d1 || [];
        }
        if ((!rel || rel.length < 4) && data?.country) {
          const { data: d2 } = await supabase
            .from("entries")
            .select("id,title,photo_url,community,country,zipcode,type")
            .eq("country", data.country)
            .neq("id", id)
            .limit(8);
          const seen = new Set(rel.map((r) => r.id));
          (d2 || []).forEach((r) => { if (!seen.has(r.id)) rel.push(r); });
        }
        if (rel.length < 4) {
          const { data: d3 } = await supabase
            .from("entries")
            .select("id,title,photo_url,community,country,zipcode,type")
            .order("id", { ascending: false })
            .neq("id", id)
            .limit(8);
          const seen = new Set(rel.map((r) => r.id));
          (d3 || []).forEach((r) => { if (!seen.has(r.id)) rel.push(r); });
        }
        setRelated(rel.slice(0, 8));
      } catch (e: any) {
        console.warn("related fetch error", e?.message || e);
      }
    })();
    return () => { active = false; };
  }, [id]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        padding: "24px 20px 60px",
        fontFamily: "Space Mono, monospace",
        textTransform: "uppercase",
        color: "#000",
      }}
    >
      {/* Top header */}
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto 16px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <a
          href="/"
          style={{
            border: "2px solid #000",
            padding: "8px 12px",
            borderRadius: 9999,
            textDecoration: "none",
            color: "#000",
            fontWeight: 800,
            background: "#fff",
            display: "inline-block",
          }}
        >
          ← Culture Explorer
        </a>
        <a
          href="https://linktr.ee/countercult"
          target="_blank"
          rel="noreferrer"
          style={{
            border: "2px solid #000",
            padding: "8px 12px",
            borderRadius: 9999,
            textDecoration: "none",
            color: "#000",
            fontWeight: 800,
            background: "#fff",
            display: "inline-block",
            fontSize: 12,
          }}
        >
          A Free Database by CounterCult Creatives ↗
        </a>
      </div>

      {/* Main card */}
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto 20px",
          background: "#fff",
          borderRadius: 14,
          border: "2px solid #000",
          boxShadow: "0 6px 0 #000",
          overflow: "hidden",
        }}
      >
        {(!row && !err) && <div style={{ padding: 24, background: "#fff" }}>Loading…</div>}
        {err && <div style={{ padding: 24, background: "#fff", color: "#B00020" }}>Error: {err}</div>}

        {row && (
          <>
            {row.photo_url && (
              <img
                src={row.photo_url}
                alt={row.title}
                style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }}
              />
            )}

            <div style={{ padding: 18 }}>
              <h1 style={{ margin: "0 0 6px 0", fontSize: 24 }}>{row.title}</h1>
              <div style={{ color: "#444", marginBottom: 8 }}>
                {(row.type || "artist")} • {row.city ? row.city + ", " : ""}{row.country} {row.zipcode}
              </div>

              {row.community && (
                <div style={{ marginBottom: 8, fontStyle: "italic", color: "#333" }}>
                  {row.community}
                </div>
              )}

              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4, color: "#000" }}>
                {row.description}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {row.link && (
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      border: "2px solid #000",
                      padding: "10px 14px",
                      borderRadius: 9999,
                      textDecoration: "none",
                      color: "#fff",
                      background: "#000",
                      fontWeight: 800,
                    }}
                  >
                    Visit Link ↗
                  </a>
                )}
                <a
                  href="/"
                  style={{
                    border: "2px solid #000",
                    padding: "10px 14px",
                    borderRadius: 9999,
                    textDecoration: "none",
                    color: "#000",
                    background: "#fff",
                    fontWeight: 800,
                  }}
                >
                  Back to Map
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Related grid */}
      <h2
        style={{
          maxWidth: 1080,
          margin: "0 auto 10px",
          color: "#fff",
          letterSpacing: 1,
          fontSize: 16,
        }}
      >
        More from the map
      </h2>

      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {related.length === 0 && (
          <div style={{ color: "#888", fontSize: 12, gridColumn: "1 / -1", textAlign: "center" }}>
            None yet — check back soon.
          </div>
        )}
        {related.map((e) => (
          <RelCard key={e.id} e={e} />
        ))}
      </div>
    </div>
  );
}
