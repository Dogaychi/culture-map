import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { admin } from "../_client";

export async function GET(req: Request) {
  const user = await requireAdmin(req.headers);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supa = admin();
  const { data: entries, error: e1 } = await supa
    .from("entries")
    .select("*")
    .in("status", ["pending", "rejected"])
    .order("id", { ascending: true });
  const { data: events, error: e2 } = await supa
    .from("events")
    .select("*")
    .in("status", ["pending", "rejected"])
    .order("id", { ascending: true });
  if (e1 || e2) return NextResponse.json({ error: e1?.message || e2?.message }, { status: 500 });
  return NextResponse.json({ entries: entries ?? [], events: events ?? [] });
}
