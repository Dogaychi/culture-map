"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import styles from "./MapClient.module.css";
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
  address?: string;
  community?: string;
  link?: string;
  photo_url?: string;
  type?: string;
  lat?: number | null;
  lon?: number | null;
};

type EntryWithCoords = Entry & { lat: number; lon: number };

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
  const lastMissingKeyRef = useRef<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // mirror entries for local augmentation
  useEffect(() => {
    setWithCoords(entries);
  }, [entries]);

  // helper to build a stable geocode key
  function buildKey(e: Entry) {
    const parts = [
      (e.address || "").trim(),
      (e.city || "").trim(),
      (e.zipcode || "").trim(),
      (e.country || "").trim(),
    ].filter(Boolean);

    if (parts.length === 0) return "";

    const raw = parts.join(" ").replace(/\s+/g, " ").trim();
    return raw.toLowerCase();
  }

  // geocode ONLY when entries list changes (initial and after new submissions)
  useEffect(() => {
    if (workingRef.current) return;

    // Process every entry to ensure lat/lon is in supabase--if not, calculate it and update db
    const fetchCoords = async () => {
      workingRef.current = true;
      setIsGeocoding(true);

      try {
        // refresh entries that have no valid lat/lon
        const missing = (entries || []).filter(
          (e) => !Number.isFinite(e.lat as any) || !Number.isFinite(e.lon as any)
        );

        if (missing.length === 0) {
          lastMissingKeyRef.current = "";
          setWithCoords(entries);
          return;
        }

        // Prepare to update any with new coords from OSM
        let didSomething = false;
        const pendingUpdates: { id: number; lat: number; lon: number }[] = [];

        // Copy of entries to mutate before pushing into React state
        let newEntries = [...entries];

        for (const e of missing) {
          // If supabase already has coords, that's all we need (shouldn't appear in `missing`)
          if (Number.isFinite(e.lat) && Number.isFinite(e.lon)) continue;

          const key = buildKey(e);
          if (!key) continue;

          //await sleep(1000); // be nice to Nominatim

          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
              key
            )}`;
            const res = await fetch(url, { headers: { Accept: "application/json" } });
            if (res.ok) {
              const data = (await res.json()) as Array<{ lat: string; lon: string }>;
              if (data?.length) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                if (Number.isFinite(lat) && Number.isFinite(lon)) {
                  // Update the local list for immediate UX
                  newEntries = newEntries.map((x) =>
                    x.id === e.id ? { ...x, lat, lon } : x
                  );
                  // Prepare to persist to supabase in batch
                  const result = await supabase.from("entries").update({ lat, lon }).eq("id", e.id);
                  console.log("RESULT", result);
                  if (result.error) {
                    console.error("ERROR UPDATING", result.error);
                  } else {
                    console.log("UPDATED", result.data);
                  }
                }
              }
            }
          } catch {
            // ignore errors and try next
          }
        }

        // Push new coords into supabase in batch
        if (pendingUpdates.length > 0) {
          try {
            console.log("UPDATING", pendingUpdates);
            await supabase.from("entries").upsert(pendingUpdates, { onConflict: "id" });
          } catch {
            // ignore best-effort persistence errors
          }
        }

        setWithCoords(newEntries);
      } finally {
        workingRef.current = false;
        setIsGeocoding(false);
      }
    };

    fetchCoords();
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

  const markers: EntryWithCoords[] = filtered.filter(
    (e) => Number.isFinite(e.lat as any) && Number.isFinite(e.lon as any)
  ) as EntryWithCoords[];

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
    <div className={styles.mapContainer}>
      {pinsLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <div>Loading pins…</div>
          </div>
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={2}
        className={styles.leafletRoot}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        touchZoom={true}
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
              <div className={styles.popup}>
                <strong className={styles.popupTitle}>{e.title}</strong>
                <div className={styles.popupDescription}>
                  {(() => {
                    const text = e.description || "";
                    return text.length > 100 ? `${text.slice(0, 100)}…` : text;
                  })()}
                </div>
                {e.community && (
                  <div className={styles.popupCommunity}>{e.community}</div>
                )}
                <div className={styles.popupLocation}>
                  {(e.city ? e.city + ", " : "")}{e.country} {e.zipcode}
                </div>

                {e.photo_url && (
                  <img
                    src={e.photo_url}
                    alt={e.title}
                    className={styles.popupImage}
                  />
                )}

                <div className={styles.popupActions}>
                  <a
                    href={`/entry/${e.id}`}
                    className={styles.popupButton}
                  >
                    MORE →
                  </a>
                  {e.link && (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.popupButton}
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
