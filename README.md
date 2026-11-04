# Gifford PT — Website

A clean, light one-page site for [@gifford.pt](https://www.instagram.com/gifford.pt).
No build step — plain HTML/CSS/JS. Open `index.html` in a browser, or host the folder
anywhere (Netlify, Cloudflare Pages, GitHub Pages).

- **Hosting + buying the domains:** see `HOSTING-AND-DOMAINS.txt`.
- **Managing it yourself + keeping client data safe:** see `MANAGING-YOUR-SITE.txt`.
- **Design:** white + black + soft green. Big text, high contrast, easy for any age.

## The page, top to bottom

Hero (big Book button) → **About Me** + a clickable **photo gallery** → **What I offer**
(Boxing, Bootcamp, Online S&C) → **Book a session** (Google calendar) → **Testimonies** →
FAQ → footer. The "Book a session" button in the top bar is always visible.

## Edit your content

Open `index.html` and search for `✏️ EDIT` — every placeholder is marked. Main ones:

- **About Me** — Jack's bio (in his own words) and the "what I coach" chips.
- **What I offer** — the three service cards.
- **Testimonies** — the three real client quotes are already in. Add each client's first
  name in the `<footer>` (currently "— Gifford PT client"). Copy a whole
  `<blockquote class="card review">` block to add more. (Added by hand so no one can spam
  fake reviews.)
- **FAQ** — replace the placeholder answers. Copy a `<div class="faq-item">` block to
  add a question.
- **Contact email** — replace `hello@example.com` (Testimonies "Share your experience"
  button) with Jack's real email.

## The photo gallery

The About section shows a big photo with four thumbnails beneath it — click a thumbnail
to change the main photo. The four photos live at:

| File | |
|---|---|
| `assets/gallery-1.jpg` | Jack + client in the gym (shown first) |
| `assets/gallery-2.jpg` | Jack + client in the ring |
| `assets/gallery-3.jpg` | Jack cornering a boxer (trophy) |
| `assets/gallery-4.jpg` | Jack with a medal-winning boxer |

To swap a photo, just replace the file with the same name (roughly a **4:5 portrait**
shape works best). To add or remove gallery photos, copy/delete a `<button class="gthumb">`
line in the gallery and add/remove the matching `assets/gallery-N.jpg` file.

---

## Booking + taking payment online (Google)

Booking runs through **Google Appointment Schedules** — part of Google Calendar. It uses
your real calendar, so clients only see genuinely free times, it can't be double-booked,
and it can **take payment when they book** (via Stripe). Everything lands in your Google
Calendar automatically.

**One-time setup (Jack does this in his own accounts — the site never sees any card or
password details):**

1. In **Google Calendar** (calendar.google.com), click **Create → Appointment schedule**.
2. Set the session name, length, and the days/times you're available. Google blocks
   double-bookings automatically.
3. To take payment, open the schedule's settings → **Booking form and payment** →
   connect **Stripe** and set your price. *(Taking payments needs a paid Google tier —
   Google Workspace Individual or a qualifying Workspace plan. A free Google account can
   take bookings but not payment.)*
4. Optional: turn on **Google Meet** so online sessions get a video link automatically.
5. Click **Share → “Add to your website”** (or copy the booking page link). You'll get a
   link like `https://calendar.google.com/calendar/appointments/schedules/AbC123...`.
6. In `index.html`, find this line (search for `data-url`):

   ```html
   <div class="book-card" id="bookCta"
        data-url="https://calendar.google.com/calendar/appointments/schedules/YOUR-GOOGLE-BOOKING-LINK">
   ```

   Replace `YOUR-GOOGLE-BOOKING-LINK` (keep the rest of the address) with your real link
   and save.

That's it — the "Open the booking calendar" button then opens your live Google booking
page. Until you add a real link, that button is hidden and a friendly setup note shows,
plus an "DM @gifford.pt" fallback, so the page is never broken.

> Want the calendar embedded *inside* the page instead of opening in a new tab? Google's
> "Add to your website" option also gives an `<iframe>` embed snippet — ask me and I'll
> drop it straight into the booking section.

---

## Reviews are added by hand (on purpose)

To keep trolls and spam out, testimonies aren't an open form — you add them yourself so
only genuine ones appear. Copy a `<blockquote class="card review">` block in the
Testimonies section and edit the stars, quote and name. Clients can send you a review
privately with the **"Share your experience"** button (it opens an email to you); you
paste the good ones in.

## Change colours

All theme colours live at the top of `css/style.css` in the `:root` block. The main one
is `--green` (the accent). `--green-deep` is the dark footer; `--green-soft` is the light
tint.

## Preview it on your computer

Easiest: double-click `index.html`. Or, to mimic a real server (needs Python):

```
cd "C:\Users\harry\OneDrive\Desktop\poker_analyzer\gifford-pt"
python -m http.server 4173
```

then open `http://localhost:4173`. Press Ctrl+C to stop. If you edit CSS/JS and don't see
changes, do a hard refresh (Ctrl+F5) to clear the browser cache.
