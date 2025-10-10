export function isAuthorized(headers: Headers) {
  const provided = headers.get("x-admin-key") || "";
  const expected = process.env.ADMIN_PASSWORD || "";
  return Boolean(provided && expected && provided === expected);
}
