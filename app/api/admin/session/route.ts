import { NextResponse } from "next/server";
import { admin } from "../../_client";

export async function POST(req: Request) {
  const body = await req.json();
  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const supa = admin();
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const { session, user } = data;
  return NextResponse.json({
    access_token: session?.access_token,
    refresh_token: session?.refresh_token,
    user,
  });
}

