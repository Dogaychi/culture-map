"use client";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import CookieConsentModal from "./components/CookieConsentModal";
import Footer from "./components/Footer";
import styles from "./home.module.css";
import { supabase } from "./lib/supabase";

const MapWithClient = dynamic(() => import("./lib/MapClient"), { ssr: false });

type Entry = {
  id: number;
  title: string;
  description?: string;
  type?: "artist" | "space" | "artifact";
  country?: string;
  city?: string;
  zipcode?: string;
  address?: string;
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
    address: "",
    community: "",
    link: "",
    photo: null as File | null,
    consent_store: false,
    consent_share: false,
  });

  async function load() {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("status", "approved")
      .order("id", { ascending: false });
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

  const mapEntries = useMemo(() => {
    return (entries || []).map((e) => ({
      ...e,
      description: e.description || "",
      country: e.country || "",
      zipcode: e.zipcode || "",
    }));
  }, [entries]);

  async function handleSubmit() {
    const requiresAddress = form.type === "space";
    if (
      !form.title ||
      !form.description ||
      !form.country ||
      !form.city ||
      !form.zipcode ||
      (requiresAddress && !form.address.trim())
    ) {
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
      address: form.address || null,
      community: form.community || null,
      link: form.link || null,
      photo_url: photoUrl,
      lat: null, lon: null,
      consent_store: !!form.consent_store,
      consent_share: !!form.consent_share,
      status: "pending"
    };

    const { error } = await supabase.from("entries").insert([row]);
    setLoading(false);
    if (error) { alert(error.message); }
    else {
      setForm({
        type: "artist", title: "", description: "", country: "", city: "",
        zipcode: "", address: "", community: "", link: "", photo: null,
        consent_store: false, consent_share: false,
      });
      await load();
      alert("Submitted!");
    }
  }

  const Pill = ({ className = "", ...props }: any) => (
    <button {...props} className={`${styles.pill} ${className}`.trim()} />
  );

  const Card = ({ e }: { e: Entry }) => (
    <div className={styles.card}>
      <div className={styles.cardImage}>
        {e.photo_url ? (
          <img src={e.photo_url} alt={e.title}/>
        ) : null}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{e.title}</div>
        <div className={styles.cardMeta}>
          {(e.type || "artist")} • {(e.community || "").toUpperCase()}
        </div>
        <div className={styles.cardLocation}>
          {(e.city ? e.city + ", " : "")}{e.country} {e.zipcode}
        </div>
      </div>
      <a href={`/entry/${e.id}`} className={styles.cardLink}>
        OPEN ↗
      </a>
    </div>
  );

  return (
    <div className={styles.layoutShell}>
      <CookieConsentModal/>
      {/* TOP NAV */}
      <div className={styles.topNav}>
        <a href="/" className={styles.logoLink}>
          Culture Explorer
        </a>

        <a href="https://linktr.ee/countercult" target="_blank" rel="noreferrer" className={styles.ctaLink}>
          Countercult Creatives ↗
        </a>
      </div>

      {/* Marquee */}
      <div className={styles.marquee}>
        <div className={styles.marqueeInner}>
          THIS MAP COLLECTS ARTISTS, CULTURAL SPACES, AND ARTIFACTS • ADD ENTRIES USING THE SUBMIT FORM • KEYWORDS HELP DISCOVERY •
        </div>
      </div>

      {/* Main */}
      <div className={styles.layoutMain}>
        {/* MAP (mobile-first placement) */}
        <div className={`${styles.col} ${styles.colMapMobile}`}>
          <div className={styles.mapWrapperMobile}>
            <MapWithClient entries={mapEntries} filter={""} search={search}/>
          </div>
        </div>

        {/* LEFT (white, scrollable) */}
        <div className={`${styles.col} ${styles.colLeft}`}>
          {/* SEARCH */}
          <div className={styles.searchSection}>
            <div className={styles.sectionTitle}>Search</div>

            <div className={styles.pillGroup}>
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
              className={styles.searchInput}
            />
          </div>

          <div className={styles.divider} />

          {/* SUBMIT */}
          <div className={styles.submitSection}>
            <div className={styles.sectionTitle}>Submit</div>

            <button onClick={()=>setFormOpen(v=>!v)} className={styles.toggleFormBtn}>
              {formOpen ? "Close Form" : "Open Form"}
            </button>

            {formOpen && (
              <div className={styles.formContainer}>
                <select
                  value={form.type}
                  onChange={(e)=>setForm({...form,type:e.target.value})}
                  className={styles.select}
                >
                  <option value="artist">Artist</option>
                  <option value="space">Cultural Space</option>
                  <option value="artifact">Artifact</option>
                </select>

                <input className={styles.input} placeholder="Title *" value={form.title}
                  onChange={(e:any)=>setForm({...form,title:e.target.value})}/>

                <textarea className={styles.textarea} placeholder="Description *" value={form.description}
                  onChange={(e:any)=>setForm({...form,description:e.target.value})}/>

                <input className={styles.input} placeholder="Country *" value={form.country}
                  onChange={(e:any)=>setForm({...form,country:e.target.value})}/>

                <input className={styles.input} placeholder="City / Town *" value={form.city}
                  onChange={(e:any)=>setForm({...form,city:e.target.value})}/>

                <input className={styles.input} placeholder="ZIP Code *" value={form.zipcode}
                  onChange={(e:any)=>setForm({...form,zipcode:e.target.value})}/>

                <input
                  className={styles.input}
                  placeholder="Street Address (required for Cultural Spaces)"
                  value={form.address}
                  onChange={(e:any)=>setForm({...form,address:e.target.value})}
                  required={form.type === "space"}
                />

                <input className={styles.input} placeholder="Community / Subculture (optional)" value={form.community}
                  onChange={(e:any)=>setForm({...form,community:e.target.value})}/>

                <input className={styles.fileInput} type="file" accept="image/*"
                  onChange={(e:any)=>setForm({...form,photo:e.target.files?.[0]||null})}/>

                <input className={styles.input} placeholder="Optional link" value={form.link}
                  onChange={(e:any)=>setForm({...form,link:e.target.value})}/>

                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={form.consent_store}
                         onChange={(e)=>setForm({...form,consent_store:e.target.checked})}/>
                  Allow us to store this data
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={form.consent_share}
                         onChange={(e)=>setForm({...form,consent_share:e.target.checked})}/>
                  Allow us to share this data
                </label>

                <button onClick={handleSubmit} disabled={loading} className={styles.submitButton}>
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* DATABASE */}
          <div className={styles.databaseTitle}>Database</div>

          <div className={styles.cardGrid}>
            {filtered.map((e) => <Card key={e.id} e={e} />)}
            {filtered.length === 0 && (
              <div className={styles.emptyState}>
                No results yet — try a different keyword or add a submission.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MAP (desktop/tablet) */}
        <div className={`${styles.col} ${styles.colRight}`}>
          <div className={styles.mapWrapperDesktop}>
            <MapWithClient entries={mapEntries} filter={""} search={search}/>
          </div>
        </div>
      </div>

      {/* Footer (site-wide legal & links) */}
      <Footer />
    </div>
  );
}
