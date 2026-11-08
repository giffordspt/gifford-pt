# Giffords PT — Booking and 48-hour cancellation alerts

## Current configuration (8 November 2026)
- Live Calendly event type: [Giffords PT — 1-to-1 Boxing or Personal Training](https://calendly.com/giffordspt/giffords-pt-1-to-1-boxing-or-personal-training).
- Event length: 60 minutes. No online payment.
- Studio: Unit 4C, Battledown Industrial Estate, 5 King Alfred Way, Cheltenham GL52 6QP.
- Live website page source: `/booking.html`; home page CTA links there.
- User timezone: Europe/London.
- Current default availability in Calendly: Monday-Friday, 09:00-17:00. **Check and change these hours before inviting clients.** Class times or private appointments must be marked Busy in the connected Google Calendar.
- Tuesday 10 November 2026 at 14:00 was checked as an example; it was available in Calendly at the time of checking. **No booking was made.** This does not independently prove Google Calendar conflict checking is connected.

## 1. Finalise Google Calendar connection (required)
Go to [Calendly calendar settings](https://calendly.com/app/availability/calendar_connections) or use **Settings → Scheduling → Calendars**.
1. Connect Google Calendar with the account that owns your appointments (likely giffordspt@gmail.com).
2. Select the calendar(s) under **Calendars to check for conflicts**. Check the exact calendars holding all personal training, boxing and class bookings.
3. Select **Calendar to add events to**, choosing the Google Calendar where new 1-to-1 sessions should appear.
4. Ensure existing bookings are marked **Busy**. If a class is in Gymcatch but not reflected in Google Calendar, add a Busy event to Google Calendar for that class.
5. Verify by adding a temporary **Busy** event and confirming that slot disappears from the public Calendly availability. Then remove the temporary Busy event.
6. Set real bookable hours and any buffer time in the Calendly event type editor. The initial 09:00–17:00 Monday–Friday hours were inherited from the account's default availability.

Calendly's website booking and calendar integration works independently of the late alert machinery below. The alert machinery is **not yet active** until its secrets and registration are configured.

## 2. Set up the email bridge (Google Apps Script)
The website cannot itself send email from Gmail. A private Google Apps Script receives verified notifications and emails them to **giffordspt@gmail.com**.

1. In [Google Apps Script](https://script.google.com/home), create a standalone project named `Giffords PT Late Cancellations`.
2. Open `integrations/late-cancellation-alerts.gs` in this repository and copy its content to the Apps Script `Code.gs` file.
3. In **Project Settings → Script Properties**, create:
   - `FORWARD_SECRET`: a random 32+ character secret (invent locally; do not send it over chat or commit it to GitHub).
   - `CALENDLY_SIGNING_KEY`: a separate random 32+ character secret.
   - `CALENDLY_TOKEN`: a Calendly personal access token made in Calendly **Developer → Personal access tokens**, with `webhooks:write` scope.
4. Deploy **New deployment → Web app**. Execute as **Me** and access **Anyone**. Copy the resulting `https://script.google.com/macros/s/.../exec` URL.
5. Run `sendTestNotification` once inside Apps Script and grant the requested permissions. You should receive an email. The web app itself doesn't let unauthorised callers email you because it requires the secret.
6. Keep this script **private**. Do not publish Script Properties or tokens.

## 3. Configure the Cloudflare Pages webhook endpoint
The repository contains `functions/api/calendly-cancellation.js`, a Cloudflare Pages Function. It checks Calendly's HMAC signature and detects changes made with less than 48 hours' notice.

1. In Cloudflare **Workers & Pages**, select the Pages site for `giffordspt.co.uk`.
2. Under **Settings → Variables and Secrets**, add these *encrypted secrets*:
   - `CALENDLY_WEBHOOK_SIGNING_KEY`: same value as Apps Script `CALENDLY_SIGNING_KEY`.
   - `FORWARD_SECRET`: same value as Apps Script `FORWARD_SECRET`.
   - `LATE_ALERT_WEB_APP_URL`: the Apps Script web app `/exec` URL copied above.
3. Save the secrets for the production environment and redeploy the latest GitHub commit if necessary. Do not put any of these values in public HTML or GitHub files.
4. The endpoint is `https://giffordspt.co.uk/api/calendly-cancellation`. It is not a normal web page and accepts only signed POST requests.

## 4. Register the Calendly webhook
Once the Cloudflare and Apps Script components are deployed and configured:

1. In the Apps Script editor run `registerCalendlyCancellationWebhook` **once**.
2. It registers a user-scoped `invitee.canceled` webhook with your signing key.
3. It uses the account's known Calendly user and organization URIs, not a guessed calendar.
4. Test using a **disposable test booking**, then cancel or reschedule it with less than 48 hours' notice. You should receive an email containing client, start time, change time and notice provided.
5. Check Cloudflare Functions logs and Apps Script Executions for failed delivery. Cloudflare returns a non-2xx error to Calendly when the email bridge fails so Calendly can retry. Apps Script deduplicates retries by invitee URI.

## 5. Policy
- Clients can cancel / reschedule through their confirmation email.
- A change with 48 hours or less before the original start time generates a **48-HOUR ALERT** email to giffordspt@gmail.com once configured; this is a notification threshold, not automatically a cancellation-fee policy.
- Host-initiated cancellations are skipped when Calendly identifies the canceler as the host.
- A reschedule is shown as **RESCHEDULED** (since Calendly sends a cancellation webhook for the previous slot).
- Alerts **do not deduct session credits** or charge payments automatically. Review the customer's agreement and package manually.
- Keep client details private. Never place public client information in the website source.

## 6. Troubleshooting
- The booking page is linked in `index.html` and can be shared at `https://giffordspt.co.uk/booking.html` once Cloudflare deploys.
- The event type itself can be booked directly: `https://calendly.com/giffordspt/giffords-pt-1-to-1-boxing-or-personal-training`.
- If Google Calendar is disconnected, Calendly's availability may show times that you are actually busy. Reconnect and test before accepting bookings.
- If the 48-hour email isn't arriving, check all three Cloudflare secrets and the two shared values in Apps Script; then look at Cloudflare function logs and Apps Script Executions.
- Calendly free plan can support this single event type; separate Boxing vs PT event types may require a paid plan. The service selection is reflected through URL tracking `utm_content`, and clients are also prompted to mention their focus during booking.

### References
- https://developer.calendly.com/api-docs/overview/embedding/getting-started
- https://developer.calendly.com/api-docs/overview/webhooks/webhook-signatures
- https://developer.calendly.com/api-docs/calendly-api/webhooks/create-webhook-subscription
- https://calendly.com/help/how-to-connect-your-google-calendar
- https://developers.cloudflare.com/pages/functions/bindings/
