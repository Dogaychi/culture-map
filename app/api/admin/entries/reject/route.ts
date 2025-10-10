import { NextResponse } from "next/server";
import { admin } from "../../_client";
import { isAuthorized } from "../../_auth";

export async function POST(req: Request) {
  if (!isAuthorized(req.headers)) return NextResponse.json({ error:"unauthorized" }, { status:401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error:"missing id" }, { status:400 });
  const supa = admin();
  const { error } = await supa.from("entries").update({ status:"rejected" }).eq("id", id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
