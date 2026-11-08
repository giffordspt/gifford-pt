/**
 * Giffords PT — automatic 48-hour cancellation alerts.
 * Deploy as a Google Apps Script web app (run as me; access anyone).
 * Store FORWARD_SECRET, CALENDLY_TOKEN and CALENDLY_SIGNING_KEY
 * in Apps Script Project Settings > Script Properties.
 * Never paste real secrets into this public source file.
 */
const ALERT_TO = "giffordspt@gmail.com";
const USER_URI = "https://api.calendly.com/users/eb5be076-d5f1-4f03-a380-349317d99237";
const ORG_URI = "https://api.calendly.com/organizations/ccae38cb-969c-405d-9cda-5541597ee7b9";
const WEBHOOK_URL = "https://giffordspt.co.uk/api/calendly-cancellation";

function response_(s) {
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.TEXT);
}
function doPost(e) {
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty("FORWARD_SECRET");
  if (!secret || !e || !e.postData || !e.postData.contents) return response_("DENIED");
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return response_("INVALID"); }
  if (d.secret !== secret) return response_("DENIED");
  const start = Date.parse(d.startTime || "");
  const canceled = Date.parse(d.canceledAt || "");
  if (!isFinite(start) || !isFinite(canceled)) return response_("INVALID");
  const notice = (start - canceled) / 3600000;
  // Re-check the rule here: never trust a passed-in hoursNotice value.
  if (notice > 48) return response_("OK");
  const id = String(d.inviteeUri || (d.email + "|" + d.startTime)).slice(0, 500);
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, id)
    .map(x => ("0" + (x & 255).toString(16)).slice(-2)).join("");
  const key = "handled_" + hash;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return response_("RETRY");
  try {
    if (properties.getProperty(key)) return response_("OK");
    const startLocal = Utilities.formatDate(new Date(start), "Europe/London", "EEE d MMM yyyy, HH:mm");
    const canceledLocal = Utilities.formatDate(new Date(canceled), "Europe/London", "EEE d MMM yyyy, HH:mm");
    const action = d.rescheduled ? "RESCHEDULED" : "CANCELLED";
    const hoursDescription = notice < 0 ? "after session start" : (Math.round(notice * 10) / 10) + " hours before";
    const subject = "48-HOUR ALERT: " + action + " — " + String(d.name || "Client");
    const body = [
      "Giffords PT — late booking change",
      "",
      "Client: " + String(d.name || ""),
      "Email: " + String(d.email || ""),
      "Session: " + String(d.eventType || ""),
      "Focus: " + String(d.sessionFocus || ""),
      "Original start: " + startLocal + " (UK time)",
      "Cancellation: " + canceledLocal + " (UK time)",
      "Notice: " + hoursDescription,
      "Change: " + action,
      "Canceled by: " + String(d.canceledBy || ""),
      "Reason: " + String(d.reason || "Not provided"),
      "",
      "Review the client's prepaid session balance manually. Nothing is charged or deducted automatically."
    ].join("\n");
    MailApp.sendEmail({to: ALERT_TO, subject: subject, body: body});
    properties.setProperty(key, new Date().toISOString());
    return response_("OK");
  } catch (err) {
    console.error(String(err));
    return response_("ERROR");
  } finally {
    lock.releaseLock();
  }
}
/**
 * Run ONCE after configuring the script properties and after deploying both
 * this Apps Script web app and the Cloudflare Pages Function.
 * This creates a Calendly invitee.canceled webhook subscription.
 * A repeat call can return HTTP 409; it must not be run on a daily trigger.
 */
function registerCalendlyCancellationWebhook() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty("CALENDLY_TOKEN");
  const signingKey = properties.getProperty("CALENDLY_SIGNING_KEY");
  if (!token || !signingKey) throw new Error("Missing CALENDLY_TOKEN or CALENDLY_SIGNING_KEY script property.");
  const payload = {
    url: WEBHOOK_URL,
    events: ["invitee.canceled"],
    organization: ORG_URI,
    user: USER_URI,
    scope: "user",
    signing_key: signingKey
  };
  const response = UrlFetchApp.fetch("https://api.calendly.com/webhook_subscriptions", {
    method: "post", contentType: "application/json",
    headers: { Authorization: "Bearer " + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  if (code !== 201) throw new Error("Calendly webhook setup failed (" + code + "): " + response.getContentText());
  console.log("Webhook registered successfully. Check Calendly developer subscriptions.");
}
function sendTestNotification() {
  MailApp.sendEmail(ALERT_TO, "Giffords PT cancellation alerts — email test",
    "The Google Apps Script notification sender is authorised. This is not a client cancellation.");
}
