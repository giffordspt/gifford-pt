// Cloudflare Pages Function: POST /api/calendly-cancellation
// Requirements: Cloudflare encrypted secrets CALENDLY_WEBHOOK_SIGNING_KEY,
// LATE_ALERT_WEB_APP_URL, and FORWARD_SECRET. See integrations/BOOKING-SETUP.md.
// Do not expose any secret in website code or the GitHub repository.
const EVENT_TYPE = "https://api.calendly.com/event_types/864a8d4e-c882-4c83-8f23-f94f9214bcea";
const enc = new TextEncoder();

function constantTimeHexMatch(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length || !/^[a-f0-9]{64}$/i.test(a)) return false;
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return different === 0;
}
async function signedByCalendly(raw, header, secret) {
  const pairs = Object.fromEntries(String(header || "").split(",").map(s => s.trim().split("=", 2)));
  const t = Number(pairs.t);
  if (!Number.isSafeInteger(t) || Math.abs(Date.now() / 1000 - t) > 180) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(String(pairs.t) + "." + raw));
  const expected = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("");
  return constantTimeHexMatch(String(pairs.v1 || "").toLowerCase(), expected);
}
export async function onRequestPost({ request, env }) {
  if (!env.CALENDLY_WEBHOOK_SIGNING_KEY || !env.LATE_ALERT_WEB_APP_URL || !env.FORWARD_SECRET) return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (!(await signedByCalendly(raw, request.headers.get("calendly-webhook-signature"), env.CALENDLY_WEBHOOK_SIGNING_KEY))) return new Response("Invalid signature", { status: 401 });
  let data;
  try { data = JSON.parse(raw); } catch { return new Response("Invalid JSON", { status: 400 }); }
  if (data.event !== "invitee.canceled") return new Response("ignored", { status: 200 });
  const p = data.payload || {};
  const scheduled = p.scheduled_event || {};
  if (scheduled.event_type !== EVENT_TYPE) return new Response("ignored", { status: 200 });
  // Calendly sends timestamps in ISO 8601 UTC; prefer the invitee's cancellation update time.
  const start = Date.parse(scheduled.start_time || "");
  const canceled = Date.parse(p.updated_at || data.created_at || "");
  if (!Number.isFinite(start) || !Number.isFinite(canceled)) return new Response("missing dates", { status: 422 });
  const hours = (start - canceled) / 3600000;
  if (hours > 48) return new Response("not late", { status: 200 });
  const cancellation = p.cancellation || {};
  if (String(cancellation.canceler_type || "").toLowerCase() === "host") return new Response("host-canceled", { status: 200 });
  const alert = {
    secret: env.FORWARD_SECRET,
    inviteeUri: p.uri || p.event || "",
    eventType: scheduled.name || "Giffords PT 1-to-1",
    name: p.name || "Unknown",
    email: p.email || "",
    sessionFocus: p.tracking && p.tracking.utm_content || "unspecified",
    startTime: scheduled.start_time,
    canceledAt: p.updated_at || data.created_at,
    hoursNotice: Math.round(hours * 10) / 10,
    rescheduled: Boolean(p.rescheduled),
    canceledBy: cancellation.canceled_by || p.name || "",
    reason: cancellation.reason || ""
  };
  try {
    const r = await fetch(env.LATE_ALERT_WEB_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(alert), redirect: "follow" });
    if (!r.ok || (await r.text()).trim() !== "OK") return new Response("Delivery failed", { status: 502 });
    return new Response("OK", { status: 200 });
  } catch { return new Response("Delivery failed", { status: 502 }); }
}
