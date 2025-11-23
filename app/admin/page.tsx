"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Entry = {
  id: number;
  title: string;
  type: string;
  country: string;
  zipcode: string;
  status: string;
  city?: string;
  description?: string;
  community?: string;
  link?: string;
  photo_url?: string;
  address?: string | null;
  lat?: number | null;
  lon?: number | null;
  created_at?: string;
  updated_at?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["pending", "rejected"]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const access = data.session?.access_token || null;
      setToken(access);
      setCheckingSession(false);
      if (!access) {
        router.replace("/admin/login?redirect=/admin");
      }
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null);
      if (!session) {
        router.replace("/admin/login?redirect=/admin");
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const headers = useMemo(() => {
    if (!token) return undefined;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const statusKey = useMemo(
    () => statusFilter.slice().sort().join(","),
    [statusFilter]
  );

  const loadEntries = useCallback(async () => {
    if (!headers) return;
    setError("");
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter.length > 0) {
        params.set("status", statusFilter.join(","));
      }
      const query = params.toString();
      const res = await fetch(`/api/admin/entries${query ? `?${query}` : ""}`, { headers });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Request failed");
      }
      const json = await res.json();
      setEntries(json.entries || []);
    } catch (e: any) {
      setError(e.message || "Unknown error");
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, [headers, statusKey]);

  useEffect(() => {
    if (headers) {
      loadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, statusKey]);

  const act = useCallback(async (path: string, id: number, label: string) => {
    if (!headers) return;
    if (!confirm(`Confirm ${label.toLowerCase()} for #${id}?`)) return;
    setMutating(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Action failed");
      }
      await loadEntries();
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setMutating(false);
    }
  }, [headers, loadEntries]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setToken(null);
    router.replace("/admin/login");
  }

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.type,
        entry.city,
        entry.country,
        entry.zipcode,
        entry.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, search]);

  const toggleStatus = (value: string) => {
    setStatusFilter((prev) => {
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];
      return next.length === 0 ? prev : next;
    });
  };

  const EntryDetail = ({
    label,
    value,
    isLink = false,
  }: {
    label: string;
    value?: string | null;
    isLink?: boolean;
  }) => {
    const display = value && value.trim().length > 0 ? value : "—";
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 4, textTransform: "uppercase", fontSize: 12 }}>
          {label}
        </div>
        <div
          style={{
            border: "2px solid #000",
            borderRadius: 12,
            padding: 10,
            wordBreak: "break-word",
          }}
        >
          {isLink && value ? (
            <a href={value} target="_blank" rel="noreferrer">
              {value}
            </a>
          ) : (
            display
          )}
        </div>
      </div>
    );
  };

  if (checkingSession) {
    return (
      <div style={{ padding: 40, fontFamily: "Space Mono, monospace" }}>
        Checking session…
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const EntryTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "2px solid #000" }}>
          <th style={{ padding: "8px 4px" }}>ID</th>
          <th style={{ padding: "8px 4px" }}>Title</th>
          <th style={{ padding: "8px 4px" }}>Type</th>
          <th style={{ padding: "8px 4px" }}>Location</th>
          <th style={{ padding: "8px 4px" }}>Status</th>
          <th style={{ padding: "8px 4px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredEntries.map((e) => (
          <tr key={e.id} style={{ borderBottom: "1px solid #ddd" }}>
            <td style={{ padding: "8px 4px" }}>{e.id}</td>
            <td style={{ padding: "8px 4px", fontWeight: 700 }}>{e.title}</td>
            <td style={{ padding: "8px 4px" }}>{e.type}</td>
            <td style={{ padding: "8px 4px" }}>
              {e.city ? `${e.city}, ` : ""}
              {e.country} {e.zipcode}
            </td>
            <td style={{ padding: "8px 4px", fontWeight: 700, color: e.status === "rejected" ? "#c00" : "#555" }}>
              {e.status.toUpperCase()}
            </td>
            <td style={{ padding: "8px 4px", display: "flex", gap: 8 }}>
              <button
                onClick={() => setSelectedEntry(e)}
                style={{ border: "2px solid #000", background: "#D7FF3A", padding: "4px 12px", cursor: "pointer" }}
              >
                View
              </button>
              <button
                onClick={() => act("/api/admin/entries/approve", e.id, "Approve entry")}
                disabled={mutating}
                style={{ border: "2px solid #000", background: "#fff", padding: "4px 10px", cursor: "pointer" }}
              >
                Approve
              </button>
              <button
                onClick={() => act("/api/admin/entries/reject", e.id, "Reject entry")}
                disabled={mutating}
                style={{ border: "2px solid #c00", background: "#fff", padding: "4px 10px", cursor: "pointer", color: "#c00" }}
              >
                Reject
              </button>
              <button
                onClick={() => act("/api/admin/entries/delete", e.id, "Delete entry")}
                disabled={mutating}
                style={{ border: "2px solid #c00", background: "#c00", padding: "4px 10px", cursor: "pointer", color: "#fff" }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{
      maxWidth: 1200,
      margin: "40px auto",
      padding: "0 20px 60px",
      fontFamily: "Space Mono, monospace",
      textTransform: "uppercase"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Admin Moderation</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => loadEntries()}
            disabled={loadingEntries || mutating}
            style={{ border: "2px solid #000", background: "#fff", padding: "8px 16px", borderRadius: 9999, cursor: "pointer" }}
          >
            {loadingEntries ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={handleLogout}
            style={{ border: "2px solid #000", background: "#D7FF3A", padding: "8px 16px", borderRadius: 9999, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <div style={{ color: "#c00", marginBottom: 20 }}>{error}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["pending", "approved", "rejected"].map((status) => {
            const active = statusFilter.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                style={{
                  border: "2px solid #000",
                  padding: "6px 14px",
                  borderRadius: 9999,
                  cursor: "pointer",
                  background: active ? "#D7FF3A" : "#fff",
                }}
              >
                {status}
              </button>
            );
          })}
        </div>
        <input
          placeholder="Search entries"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: "2px solid #000",
            padding: "8px 12px",
            borderRadius: 9999,
            flex: "1 1 200px",
            minWidth: 200,
          }}
        />
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Entries</h2>
        {loadingEntries ? (
          <div style={{ color: "#666" }}>Loading entries…</div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ color: "#666" }}>No entries match your filters.</div>
        ) : (
          <EntryTable />
        )}
      </section>

      {selectedEntry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={{
              background: "#fff",
              border: "3px solid #000",
              borderRadius: 16,
              boxShadow: "0 8px 0 #000",
              maxWidth: 640,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              textTransform: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, textTransform: "uppercase" }}>
                Entry #{selectedEntry.id} • {selectedEntry.title}
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{ border: "2px solid #000", background: "#D7FF3A", padding: "6px 14px", borderRadius: 9999 }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <EntryDetail label="Status" value={selectedEntry.status} />
              <EntryDetail label="Type" value={selectedEntry.type} />
              <EntryDetail label="Country" value={selectedEntry.country} />
              <EntryDetail label="City" value={selectedEntry.city} />
              <EntryDetail label="ZIP" value={selectedEntry.zipcode} />
              <EntryDetail label="Address" value={selectedEntry.address} />
              <EntryDetail label="Community" value={selectedEntry.community} />
              <EntryDetail label="Link" value={selectedEntry.link} isLink />
              <EntryDetail label="Latitude" value={selectedEntry.lat?.toString()} />
              <EntryDetail label="Longitude" value={selectedEntry.lon?.toString()} />
              <EntryDetail label="Created" value={selectedEntry.created_at} />
              <EntryDetail label="Updated" value={selectedEntry.updated_at} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, textTransform: "uppercase", fontSize: 12 }}>
                  Description
                </div>
                <div
                  style={{
                    border: "2px solid #000",
                    borderRadius: 12,
                    padding: 12,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedEntry.description || "—"}
                </div>
              </div>
              {selectedEntry.photo_url && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, textTransform: "uppercase", fontSize: 12 }}>
                    Photo
                  </div>
                  <img
                    src={selectedEntry.photo_url}
                    alt={selectedEntry.title}
                    style={{ width: "100%", borderRadius: 12, border: "2px solid #000", objectFit: "cover" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
