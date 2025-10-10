import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try{
    const body = await req.json(); // {event, entry_type, entry_id, meta}
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || null;
    const ua = req.headers.get("user-agent") || null;

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supa.from("analytics").insert([{
      event: body.event, entry_type: body.entry_type, entry_id: body.entry_id,
      meta: body.meta ?? {}, ip, user_agent: ua
    }]);
    if(error) return NextResponse.json({error:error.message},{status:500});
    return NextResponse.json({ok:true});
  }catch(e:any){
    return NextResponse.json({error:e.message},{status:500});
  }
}
