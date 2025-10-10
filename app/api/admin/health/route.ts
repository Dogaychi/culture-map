import { NextResponse } from "next/server";
import { admin } from "../_client";
import { isAuthorized } from "../_auth";

export async function GET(req: Request) {
  if (!isAuthorized(req.headers)) {
    return NextResponse.json({ ok:false, reason:"unauthorized" }, { status: 401 });
  }
  const supa = admin();
  const { count, error } = await supa.from("entries").select("*", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok:false, reason:error.message }, { status: 500 });
  return NextResponse.json({ ok:true, entries_count: count ?? 0 });
}
