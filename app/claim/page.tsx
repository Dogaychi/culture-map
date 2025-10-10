"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Claim(){
  const [form,setForm]=useState({ entry_type:"entry", entry_id:"", email:"", message:"", evidence_url:"" });
  const [ok,setOk]=useState(false);

  async function submit(){
    if(!form.entry_id || !form.email) { alert("Entry ID and email are required"); return; }
    const { error } = await supabase.from("claims").insert([{
      entry_type: form.entry_type, entry_id: Number(form.entry_id),
      email: form.email, message: form.message, evidence_url: form.evidence_url
    }]);
    if(error) return alert(error.message);
    setOk(true);
  }

  return (
    <div style={{maxWidth:720,margin:"40px auto",padding:"0 24px",fontFamily:"Space Mono, monospace",textTransform:"uppercase"}}>
      <h1 style={{fontSize:24,marginBottom:16}}>CLAIM A PIN</h1>
      {ok ? <div>Thanks! We’ll review your claim.</div> : (
        <>
          <label>Type
            <select value={form.entry_type} onChange={e=>setForm({...form,entry_type:e.target.value})} style={{display:"block",margin:"6px 0 12px"}}>
              <option value="entry">ENTRY</option>
              <option value="event">EVENT</option>
            </select>
          </label>
          <label>Entry ID*
            <input value={form.entry_id} onChange={e=>setForm({...form,entry_id:e.target.value})} style={{display:"block",width:"100%",border:"2px solid #000",padding:"10px",margin:"6px 0 12px"}}/>
          </label>
          <label>Email*
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{display:"block",width:"100%",border:"2px solid #000",padding:"10px",margin:"6px 0 12px"}}/>
          </label>
          <label>Message
            <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{display:"block",width:"100%",border:"2px solid #000",padding:"10px",margin:"6px 0 12px"}}/>
          </label>
          <label>Evidence URL
            <input value={form.evidence_url} onChange={e=>setForm({...form,evidence_url:e.target.value})} style={{display:"block",width:"100%",border:"2px solid #000",padding:"10px",margin:"6px 0 12px"}}/>
          </label>
          <button onClick={submit} style={{border:"2px solid #000",padding:"10px 14px",borderRadius:9999,background:"#000",color:"#fff"}}>SUBMIT CLAIM</button>
        </>
      )}
    </div>
  );
}
