"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "./supabase";

/** neon yellow-green pin */
const PIN_HEX = "#E8FF3A";

const neonIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:${PIN_HEX};width:16px;height:16px;border-radius:50%;
          border:2px solid #000;box-shadow:0 0 10px ${PIN_HEX},0 0 4px ${PIN_HEX} inset;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

type Entry = {
  id: number;
  title: string;
  description: string;
  country: string;
  city?: string;
  zipcode: string;
  community?: string;
  link?: string;
  photo_url?: string;
  type?: string;
  lat?: number | null;
  lon?: number | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function MapWithClient({
  entries = [],
  filter = "",
  search = "",
}: {
  entries: Entry[];
  filter: string;
  search: string;
}) {
  const [withCoords, setWithCoords] = useState<Entry[]>([]);
  const cacheRef = useRef<Map<string, { lat: number; lon: number }>>(new Map());
  const workingRef = useRef(false);
  const lastRetryRef = useRef<number>(0);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // mirror entries for local augmentation
  useEffect(() => {
    setWithCoords(entries);
  }, [entries]);

  // helper to build a stable geocode key
  function buildKey(e: Entry) {
    const raw = `${(e.city || "").trim()} ${(e.zipcode || "").trim()} ${(e.country || "").trim()}`
      .replace(/\s+/g, " ")
      .trim();
    return raw ? raw.toLowerCase() : "";
  }

  // geocode ONLY when entries list changes (initial and after new submissions)
  useEffect(() => {
    if (workingRef.current) return;
    const missing = (entries || []).filter((e) => !Number.isFinite(e.lat as any) || !Number.isFinite(e.lon as any));
    if (missing.length === 0) return;

    workingRef.current = true;
    setIsGeocoding(true);

    (async () => {
      try {
        for (const e of missing) {
          const key = buildKey(e);
          if (!key) continue;

          let hit = cacheRef.current.get(key);

          if (!hit) {
            await sleep(1000); // be polite to Nominatim
            const q = encodeURIComponent(key);
            try {
              const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
              const res = await fetch(url, { headers: { Accept: "application/json" } });
              if (res.ok) {
                const data = (await res.json()) as Array<{ lat: string; lon: string }>;
                if (data?.length) {
                  const lat = parseFloat(data[0].lat);
                  const lon = parseFloat(data[0].lon);
                  if (Number.isFinite(lat) && Number.isFinite(lon)) {
                    hit = { lat, lon };
                    cacheRef.current.set(key, hit);
                  }
                }
              }
            } catch { /* ignore */ }
          }

          if (hit) {
            // update UI
            setWithCoords((prev) => prev.map((x) => (x.id === e.id ? { ...x, lat: hit!.lat, lon: hit!.lon } : x)));
            // persist best-effort
            try { await supabase.from("entries").update({ lat: hit.lat, lon: hit.lon }).eq("id", e.id); } catch {}
          }
        }
      } finally {
        workingRef.current = false;
        setIsGeocoding(false);
      }
    })();
  }, [entries]);

  // lightweight filter for display (runs on keystrokes but no network)
  const filtered = useMemo(() => {
    const s = (search || "").toLowerCase().trim();
    return (withCoords || []).filter((e) => {
      if (filter && e.type !== filter) return false;
      if (!s) return true;
      const hay = [e.title, e.description, e.community, e.city, e.country, e.zipcode, e.type]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [withCoords, filter, search]);

  const markers = filtered.filter(
    (e) => Number.isFinite(e.lat as any) && Number.isFinite(e.lon as any)
  ) as Required<Entry>[];

  // gentle retry: when filtering changes and some entries still lack coords, try again at most every 3s
  useEffect(() => {
    const now = Date.now();
    const need = filtered.some((e) => !Number.isFinite(e.lat as any) || !Number.isFinite(e.lon as any));
    if (!need || workingRef.current) return;
    if (now - lastRetryRef.current < 3000) return;

    lastRetryRef.current = now;
    setWithCoords((prev) => [...prev]);
  }, [filtered]);

  // loading state for overlay & locking interactions
  const pinsLoading = (entries.length > 0 && markers.length === 0) || isGeocoding;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* overlay spinner while pins load */}
      {pinsLoading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1200,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.25)", backdropFilter: "blur(1px)"
        }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            background: "#fff", color: "#000", border: "2px solid #000",
            padding: "12px 16px", borderRadius: 12,
            fontFamily: "Space Mono, monospace", textTransform: "uppercase", fontWeight: 800
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              border: "3px solid #000", borderTopColor: "transparent",
              animation: "spin 0.9s linear infinite"
            }} />
            <div>Loading pins…</div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Map fixed to its container; page doesn't scroll */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "#000", position: "absolute", inset: 0 }}
        scrollWheelZoom={!pinsLoading}
        dragging={!pinsLoading}
        doubleClickZoom={!pinsLoading}
        boxZoom={!pinsLoading}
        keyboard={!pinsLoading}
        touchZoom={!pinsLoading}
        worldCopyJump={false}
        zoomAnimation={true}
        markerZoomAnimation={true}
        fadeAnimation={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />

        {markers.map((e) => (
          <Marker key={e.id} position={[e.lat, e.lon]} icon={neonIcon}>
            <Popup>
              <div
                style={{
                  width: 240,
                  color: "#000",
                  fontSize: 12,
                  textAlign: "left",
                  fontFamily: "Space Mono, monospace",
                  textTransform: "uppercase",
                  background: "#fff",
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <strong style={{ fontSize: 14 }}>{e.title}</strong>
                <div style={{ margin: "4px 0" }}>{e.description}</div>
                {e.community && (
                  <div style={{ color: "#444", fontStyle: "italic" }}>{e.community}</div>
                )}
                <div style={{ color: "#333", marginTop: 4 }}>
                  {(e.city ? e.city + ", " : "")}{e.country} {e.zipcode}
                </div>

                {e.photo_url && (
                  <img
                    src={e.photo_url}
                    alt={e.title}
                    style={{ width: "100%", marginTop: 8, borderRadius: 8, border: "2px solid #000" }}
                  />
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <a
                    href={`/entry/${e.id}`}
                    style={{
                      border: "2px solid #000",
                      background: "#000",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: 9999,
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                  >
                    MORE →
                  </a>
                  {e.link && (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        border: "2px solid #000",
                        background: "#000",
                        color: "#fff",
                        padding: "6px 10px",
                        borderRadius: 9999,
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      LINK ↗
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
