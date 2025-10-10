import { NextResponse } from "next/server";
import { admin } from "../_client";
import { isAuthorized } from "../_auth";

export async function GET(req: Request) {
  if (!isAuthorized(req.headers)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supa = admin();
  const { data: entries, error: e1 } = await supa.from("entries").select("*").eq("status","pending").order("id",{ascending:false});
  const { data: events,  error: e2 } = await supa.from("events").select("*").eq("status","pending").order("id",{ascending:false});
  if (e1 || e2) return NextResponse.json({ error: e1?.message || e2?.message }, { status: 500 });
  return NextResponse.json({ entries: entries ?? [], events: events ?? [] });
}
