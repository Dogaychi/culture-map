"use client";
import { useEffect, useMemo, useState } from "react";
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
};

type Event = {
  id: number;
  title: string;
  country: string;
  zipcode: string;
  status: string;
  starts_at?: string;
  ends_at?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");

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

  const load = async () => {
    if (!headers) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending", { headers });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Request failed");
      }
      const json = await res.json();
      setEntries(json.entries || []);
      setEvents(json.events || []);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (headers) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  const act = async (path: string, id: number, label: string) => {
    if (!headers) return;
    if (!confirm(`Confirm ${label.toLowerCase()} for #${id}?`)) return;
    setLoading(true);
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
      await load();
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    setToken(null);
    router.replace("/admin/login");
  }

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
        {entries.map((e) => (
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
                onClick={() => act("/api/admin/entries/approve", e.id, "Approve entry")}
                style={{ border: "2px solid #000", background: "#fff", padding: "4px 10px", cursor: "pointer" }}
              >
                Approve
              </button>
              <button
                onClick={() => act("/api/admin/entries/reject", e.id, "Reject entry")}
                style={{ border: "2px solid #c00", background: "#fff", padding: "4px 10px", cursor: "pointer", color: "#c00" }}
              >
                Reject
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const EventTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "2px solid #000" }}>
          <th style={{ padding: "8px 4px" }}>ID</th>
          <th style={{ padding: "8px 4px" }}>Title</th>
          <th style={{ padding: "8px 4px" }}>Location</th>
          <th style={{ padding: "8px 4px" }}>Status</th>
          <th style={{ padding: "8px 4px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {events.map((ev) => (
          <tr key={ev.id} style={{ borderBottom: "1px solid #ddd" }}>
            <td style={{ padding: "8px 4px" }}>{ev.id}</td>
            <td style={{ padding: "8px 4px", fontWeight: 700 }}>{ev.title}</td>
            <td style={{ padding: "8px 4px" }}>
              {ev.country} {ev.zipcode}
            </td>
            <td style={{ padding: "8px 4px", fontWeight: 700, color: ev.status === "rejected" ? "#c00" : "#555" }}>
              {ev.status.toUpperCase()}
            </td>
            <td style={{ padding: "8px 4px", display: "flex", gap: 8 }}>
              <button
                onClick={() => act("/api/admin/events/approve", ev.id, "Approve event")}
                style={{ border: "2px solid #000", background: "#fff", padding: "4px 10px", cursor: "pointer" }}
              >
                Approve
              </button>
              <button
                onClick={() => act("/api/admin/events/reject", ev.id, "Reject event")}
                style={{ border: "2px solid #c00", background: "#fff", padding: "4px 10px", cursor: "pointer", color: "#c00" }}
              >
                Reject
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
            onClick={load}
            disabled={loading}
            style={{ border: "2px solid #000", background: "#fff", padding: "8px 16px", borderRadius: 9999, cursor: "pointer" }}
          >
            {loading ? "Refreshing…" : "Refresh"}
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

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Entries (Pending / Rejected)</h2>
        {entries.length === 0 ? (
          <div style={{ color: "#666" }}>None</div>
        ) : (
          <EntryTable />
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Events (Pending / Rejected)</h2>
        {events.length === 0 ? (
          <div style={{ color: "#666" }}>None</div>
        ) : (
          <EventTable />
        )}
      </section>
    </div>
  );
}
