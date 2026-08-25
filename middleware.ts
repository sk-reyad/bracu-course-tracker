declare const process: { env: Record<string, string | undefined> };

export const config = {
  matcher: ["/((?!api/|_vercel/|assets/|css/|js/|supabase/|favicon.ico).*)"]
};

function maintenanceUrl(requestUrl: URL) {
  const target = new URL("/maintenance.html", requestUrl);
  return new Response(null, { status: 307, headers: { location: target.href, "cache-control": "no-store" } });
}

function isMaintenanceExempt(url: URL) {
  return url.pathname.endsWith("/admin.html")
    || (url.pathname.endsWith("/auth.html") && url.searchParams.get("mode") === "admin")
    || url.pathname.endsWith("/maintenance.html")
    || url.pathname.endsWith("/privacy.html")
    || url.pathname.endsWith("/terms.html");
}

export default async function middleware(request: Request) {
  if (!['GET', 'HEAD'].includes(request.method)) return;
  const requestUrl = new URL(request.url);
  if (isMaintenanceExempt(requestUrl)) return;

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";
  if (!supabaseUrl || !publishableKey) return maintenanceUrl(requestUrl);

  try {
    const result = await fetch(`${supabaseUrl}/rest/v1/site_settings?id=eq.global&select=maintenance_enabled`, {
      headers: { apikey: publishableKey, authorization: `Bearer ${publishableKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(1800)
    });
    if (!result.ok) return maintenanceUrl(requestUrl);
    const rows = await result.json();
    if (!Array.isArray(rows) || rows[0]?.maintenance_enabled !== false) return maintenanceUrl(requestUrl);
    return;
  } catch (_error) {
    return maintenanceUrl(requestUrl);
  }
}
