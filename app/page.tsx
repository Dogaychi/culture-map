"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import Footer from "./components/Footer";
import "leaflet/dist/leaflet.css";
import CookieConsentModal from "./components/CookieConsentModal";

const MapWithClient = dynamic(() => import("./lib/MapClient"), { ssr: false });

type Entry = {
  id: number;
  title: string;
  description?: string;
  type?: "artist" | "space" | "artifact";
  country?: string;
  city?: string;
  zipcode?: string;
  community?: string;
  link?: string;
  photo_url?: string;
  lat?: number | null;
  lon?: number | null;
};

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    type: "artist",
    title: "",
    description: "",
    country: "",
    city: "",
    zipcode: "",
    community: "",
    link: "",
    photo: null as File | null,
    consent_store: false,
    consent_share: false,
  });

  async function load() {
    const { data } = await supabase.from("entries").select("*").order("id", { ascending: false });
    setEntries((data || []) as Entry[]);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = (search || "").toLowerCase().trim();
    if (!s) return entries;
    return entries.filter(e => {
      const hay = [e.title, e.description, e.type, e.community, e.city, e.country, e.zipcode]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [entries, search]);

  async function handleSubmit() {
    if (!form.title || !form.description || !form.country || !form.city || !form.zipcode) {
      alert("Please fill in all required fields"); return;
    }
    if (!form.photo) { alert("Please upload a photo"); return; }

    setLoading(true);
    let photoUrl = "";
    try {
      const path = `${Date.now()}_${form.photo.name}`;
      const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, form.photo);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      photoUrl = data.publicUrl;
    } catch (e) {
      console.error(e); alert("Image upload failed"); setLoading(false); return;
    }

    const row = {
      type: form.type,
      title: form.title,
      description: form.description,
      country: form.country,
      city: form.city,
      zipcode: form.zipcode,
      community: form.community || null,
      link: form.link || null,
      photo_url: photoUrl,
      lat: null, lon: null,
      consent_store: !!form.consent_store,
      consent_share: !!form.consent_share,
      status: "approved"
    };

    const { error } = await supabase.from("entries").insert([row]);
    setLoading(false);
    if (error) { alert(error.message); }
    else {
      setForm({
        type: "artist", title: "", description: "", country: "", city: "",
        zipcode: "", community: "", link: "", photo: null,
        consent_store: false, consent_share: false,
      });
      await load();
      alert("Submitted!");
    }
  }

  const Pill = (props: any) => (
    <button {...props}
      style={{
        border: "2px solid #000", background: "#fff", color: "#000",
        padding: "12px 18px", borderRadius: 9999, fontWeight: 800,
        textTransform: "uppercase", cursor: "pointer", letterSpacing: 1
      }}
    />
  );

  const Card = ({ e }: { e: Entry }) => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr auto",
      gap: 14,
      alignItems: "center",
      border: "2px solid #000",
      background: "#fff",
      color: "#000",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 4px 0 #000"
    }}>
      <div style={{
        width: 80, height: 64, border: "2px solid #000", borderRadius: 12,
        overflow: "hidden", background: "#eee"
      }}>
        {e.photo_url ? (
          <img src={e.photo_url} alt={e.title}
               style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
        ) : null}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {e.title}
        </div>
        <div style={{ fontSize: 12, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {(e.type || "artist")} • {(e.community || "").toUpperCase()}
        </div>
        <div style={{ fontSize: 11, color: "#444" }}>
          {(e.city ? e.city + ", " : "")}{e.country} {e.zipcode}
        </div>
      </div>
      <a href={`/entry/${e.id}`}
         style={{
           border: "2px solid #000", padding: "10px 14px", borderRadius: 9999,
           textDecoration: "none", color: "#000", fontWeight: 800, whiteSpace: "nowrap", letterSpacing: 1
         }}>
        OPEN ↗
      </a>
    </div>
  );

  return (
    <div style={{ height: "100dvh", display: "grid", gridTemplateRows: "56px 32px 1fr auto" }}>
      <CookieConsentModal/>
      {/* TOP NAV */}
      <div style={{
        background: "#fff",
        color: "#000",
        borderBottom: "2px solid #000",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        gap: 12
      }}>
        <a href="/" style={{
          fontFamily: "Space Mono, monospace",
          fontSize: 24,
          letterSpacing: 2,
          textTransform: "uppercase",
          textDecoration: "none",
          color: "#000"
        }}>
          Culture Explorer
        </a>

        <a
          href="https://linktr.ee/countercult"
          target="_blank"
          rel="noreferrer"
          style={{
            border: "2px solid #000",
            background: "#fff",
            color: "#000",
            padding: "8px 14px",
            borderRadius: 9999,
            fontWeight: 800,
            textDecoration: "none",
            fontSize: 12,
            textTransform: "uppercase",
            whiteSpace: "nowrap"
          }}
        >
          Countercult Creatives ↗
        </a>
      </div>

      {/* Marquee */}
      <div style={{
        background: "#D7FF3A", color: "#000", borderBottom: "2px solid #000",
        fontFamily: "Space Mono, monospace", fontStyle: "italic", fontSize: 12, overflow: "hidden", whiteSpace: "nowrap"
      }}>
        <div style={{ display: "inline-block", padding: "6px 14px", animation: "marq 30s linear infinite" }}>
          THIS MAP COLLECTS ARTISTS, CULTURAL SPACES, AND ARTIFACTS • ADD ENTRIES USING THE SUBMIT FORM • KEYWORDS HELP DISCOVERY •
        </div>
        <style>{`@keyframes marq { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>

      {/* Main */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "480px 1fr",
        height: "100%",
        minHeight: 0
      }}>
        {/* LEFT (white, scrollable) */}
        <div style={{
          background: "#fff",
          color: "#000",
          padding: 32,
          borderRight: "2px solid #000",
          height: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          minHeight: 0
        }}>
          {/* SEARCH */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily: "Space Mono, monospace",
              textTransform: "uppercase",
              marginBottom: 16,
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: 1
            }}>
              Search
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
              <Pill onClick={() => setSearch("artist")}>Artist</Pill>
              <Pill onClick={() => setSearch("space")}>Space</Pill>
              <Pill onClick={() => setSearch("artifact")}>Artifact</Pill>
            </div>

            <input
              placeholder="Search by keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              style={{
                border: "2px solid #000",
                padding: "16px 18px",
                borderRadius: 14,
                width: "100%",
                background: "#000",
                color: "#fff",
                fontFamily: "Space Mono, monospace",
                letterSpacing: 1
              }}
            />
          </div>

          <div style={{ height: 1, background: "#000", opacity: 0.10, margin: "24px 0" }} />

          {/* SUBMIT */}
          <div style={{ marginBottom: 56 }}>
            <div style={{
              fontFamily: "Space Mono, monospace",
              textTransform: "uppercase",
              marginBottom: 16,
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: 1
            }}>
              Submit
            </div>

            <button
              onClick={()=>setFormOpen(v=>!v)}
              style={{ border:"2px solid #000", background:"#fff", color:"#000", padding:"14px 16px",
                       borderRadius:9999, fontWeight:800, textTransform:"uppercase", width:"100%", textAlign:"left" }}
            >
              {formOpen ? "Close Form" : "Open Form"}
            </button>

            {formOpen && (
              <div style={{ background: "#fff", color:"#000", border:"2px solid #000", borderRadius:14, padding:16, marginTop:16 }}>
                <select
                  value={form.type}
                  onChange={(e)=>setForm({...form,type:e.target.value})}
                  style={{ border:"2px solid #000", padding:"12px 14px", borderRadius:12, width:"100%", marginBottom:14,
                           textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                >
                  <option value="artist">Artist</option>
                  <option value="space">Cultural Space</option>
                  <option value="artifact">Artifact</option>
                </select>

                <input placeholder="Title *" value={form.title}
                  onChange={(e:any)=>setForm({...form,title:e.target.value})}
                  style={{ border:"2px solid #000", padding:"14px 16px", borderRadius:12, width:"100%", marginBottom:14,
                           textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                />

                <textarea placeholder="Description *" value={form.description}
                  onChange={(e:any)=>setForm({...form,description:e.target.value})}
                  style={{ border:"2px solid #000", padding:"14px 16px", borderRadius:12, width:"100%", height:110,
                           marginBottom:14, textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                />

                <input placeholder="Country *" value={form.country}
                  onChange={(e:any)=>setForm({...form,country:e.target.value})}
                  style={{ border:"2px solid #000", padding:"14px 16px", borderRadius:12, width:"100%", marginBottom:14,
                           textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                />

                <input placeholder="City / Town *" value={form.city}
                  onChange={(e:any)=>setForm({...form,city:e.target.value})}
                  style={{ border:"2px solid #000", padding:"14px 16px", borderRadius:12, width:"100%", marginBottom:14,
                           textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                />

                <input placeholder="ZIP Code *" value={form.zipcode}
                  onChange={(e:any)=>setForm({...form,zipcode:e.target.value})}
                  style={{ border:"2px solid #000", padding:"14px 16px", borderRadius:12, width:"100%", marginBottom:14,
                           textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                />

                <input placeholder="Community / Subculture (optional)" value={form.community}
                  onChange={(e:any)=>setForm({...form,community:e.target.value})}
                  style={{ border:"2px solid #000", padding:"14px 16px", borderRadius:12, width:"100%", marginBottom:14,
                           textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                />

                <input type="file" accept="image/*"
                  onChange={(e:any)=>setForm({...form,photo:e.target.files?.[0]||null})}
                  style={{ marginBottom:14 }} />

                <input placeholder="Optional link" value={form.link}
                  onChange={(e:any)=>setForm({...form,link:e.target.value})}
                  style={{ border:"2px solid #000", padding:"14px 16px", borderRadius:12, width:"100%", marginBottom:14,
                           textTransform:"uppercase", fontFamily:"Space Mono, monospace" }}
                />

                <label style={{ display:"flex", gap:8, alignItems:"center", fontFamily:"Space Mono, monospace",
                                textTransform:"uppercase", marginBottom:12 }}>
                  <input type="checkbox" checked={form.consent_store}
                         onChange={(e)=>setForm({...form,consent_store:e.target.checked})}/>
                  Allow us to store this data
                </label>
                <label style={{ display:"flex", gap:8, alignItems:"center", fontFamily:"Space Mono, monospace",
                                textTransform:"uppercase", marginBottom:16 }}>
                  <input type="checkbox" checked={form.consent_share}
                         onChange={(e)=>setForm({...form,consent_share:e.target.checked})}/>
                  Allow us to share this data
                </label>

                <button onClick={handleSubmit} disabled={loading}
                  style={{ border:"2px solid #000", background:"#D7FF3A", padding:"14px 18px", borderRadius:9999,
                           fontWeight:800, textTransform:"uppercase", cursor:"pointer" }}>
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "#000", opacity: 0.10, margin: "24px 0" }} />

          {/* DATABASE */}
          <div style={{ fontFamily: "Space Mono, monospace", textTransform: "uppercase", marginBottom: 16 }}>
            Database
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {filtered.slice(0, 8).map((e) => <Card key={e.id} e={e} />)}
            {filtered.length === 0 && (
              <div style={{ color: "#555", fontSize: 12, fontFamily: "Space Mono, monospace" }}>
                No results yet — try a different keyword or add a submission.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MAP */}
        <div style={{ position:"relative", minHeight: 0 }}>
          <div style={{ position:"absolute", inset:0 }}>
            <MapWithClient entries={entries} filter={""} search={search}/>
          </div>
        </div>
      </div>

      {/* Footer (site-wide legal & links) */}
      <Footer />
    </div>
  );
}
