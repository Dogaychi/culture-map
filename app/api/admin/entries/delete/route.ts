import { NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
import { admin } from "../../_client";

export async function POST(req: Request) {
  const user = await requireAdmin(req.headers);
  if (!user) return NextResponse.json({ error:"unauthorized" }, { status:401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error:"missing id" }, { status:400 });
  const supa = admin();
  const { error } = await supa.from("entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}

