import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { admin } from "../_client";

function parseStatuses(url: URL) {
  const statusParam = url.searchParams.get("status");
  if (!statusParam) return ["pending", "rejected"];
  return statusParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const user = await requireAdmin(req.headers);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const statuses = parseStatuses(new URL(req.url));
  const supa = admin();

  let query = supa.from("entries").select("*").order("id", { ascending: false });
  if (statuses.length > 0) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

