import { admin } from "./_client";

export async function requireAdmin(headers: Headers) {
  const auth = headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  if (!token) return null;

  const supa = admin();
  const { data, error } = await supa.auth.getUser(token);
  if (error || !data?.user) return null;

  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0) {
    const email = (data.user.email || "").toLowerCase();
    if (!allowed.includes(email)) return null;
  }

  return data.user;
}
