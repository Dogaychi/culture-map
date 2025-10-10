"use client";
import { useEffect, useState } from "react";

type Entry = { id:number; title:string; type:string; country:string; zipcode:string; status:string };
type Event = { id:number; title:string; country:string; zipcode:string; status:string; starts_at?:string; ends_at?:string };

export default function AdminPage(){
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [entries,setEntries]=useState<Entry[]>([]);
  const [events,setEvents]=useState<Event[]>([]);
  const [error,setError]=useState("");

  async function load(){
    setError("");
    setLoading(true);
    try{
      const res = await fetch("/api/admin/pending", { headers: { "x-admin-key": password }});
      if(!res.ok){ setError("Unauthorized or server error"); setEntries([]); setEvents([]); return; }
      const json = await res.json();
      setEntries(json.entries || []);
      setEvents(json.events || []);
    }catch(e:any){ setError(e.message); }
    finally{ setLoading(false); }
  }

  async function act(path:string, id:number){
    setLoading(true);
    try{
      const res = await fetch(path, {
        method:"POST",
        headers: { "Content-Type":"application/json", "x-admin-key": password },
        body: JSON.stringify({ id })
      });
      if(!res.ok){ alert("Action failed"); return; }
      await load();
    } finally { setLoading(false); }
  }

  const Pill = ({label,onClick,color="#000"}:{label:string;onClick:()=>void;color?:string}) => (
    <button onClick={onClick}
      style={{border:`2px solid ${color}`, background:"#fff", color:"#000", padding:"6px 10px",
              borderRadius:9999, cursor:"pointer", textTransform:"uppercase", fontWeight:800}}>
      {label}
    </button>
  );

  return (
    <div style={{maxWidth:1100,margin:"40px auto",padding:"0 20px",
                 fontFamily:"Space Mono, monospace", textTransform:"uppercase"}}>
      <h1 style={{fontSize:28, marginBottom:12}}>Admin Moderation</h1>
      <div style={{display:"flex", gap:10, alignItems:"center", marginBottom:20}}>
        <input type="password" placeholder="Admin Password" value={password}
               onChange={e=>setPassword(e.target.value)}
               style={{border:"2px solid #000", padding:"10px 12px", borderRadius:10, width:260}}/>
        <Pill label={loading ? "Loading..." : "Load Pending"} onClick={load}/>
        {error && <div style={{color:"#c00",marginLeft:10}}>{error}</div>}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
        <div>
          <h2 style={{fontSize:18, marginBottom:8}}>Entries (Pending)</h2>
          {entries.length===0 ? <div style={{color:"#666"}}>None</div> : (
            <div style={{display:"grid", gap:10}}>
              {entries.map(e=>(
                <div key={e.id} style={{border:"2px solid #000", borderRadius:12, padding:12, background:"#fff"}}>
                  <div style={{fontWeight:800}}>{e.title}</div>
                  <div style={{fontSize:12, color:"#555"}}>{e.type} • {e.country} {e.zipcode} • #{e.id}</div>
                  <div style={{display:"flex", gap:8, marginTop:8}}>
                    <Pill label="Approve" onClick={()=>act("/api/admin/entries/approve", e.id)}/>
                    <Pill label="Reject"  onClick={()=>act("/api/admin/entries/reject",  e.id)} color="#c00"/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{fontSize:18, marginBottom:8}}>Events (Pending)</h2>
          {events.length===0 ? <div style={{color:"#666"}}>None</div> : (
            <div style={{display:"grid", gap:10}}>
              {events.map(ev=>(
                <div key={ev.id} style={{border:"2px solid #000", borderRadius:12, padding:12, background:"#fff"}}>
                  <div style={{fontWeight:800}}>{ev.title}</div>
                  <div style={{fontSize:12, color:"#555"}}>{ev.country} {ev.zipcode} • #{ev.id}</div>
                  <div style={{display:"flex", gap:8, marginTop:8}}>
                    <Pill label="Approve" onClick={()=>act("/api/admin/events/approve", ev.id)}/>
                    <Pill label="Reject"  onClick={()=>act("/api/admin/events/reject",  ev.id)} color="#c00"/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
