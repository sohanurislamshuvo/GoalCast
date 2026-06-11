# GoalCast — World Cup 2026 Live TV

A live sports TV hub built with **Next.js 16** (App Router) + **Tailwind CSS v4** + **hls.js**, designed for one-click deployment on **Vercel**.

- 📺 **Live channels** — your own curated channel list plus free public sports channels auto-loaded from the open-source [iptv-org](https://github.com/iptv-org/iptv) index
- ⚽ **World Cup 2026** — full 104-match schedule with live scores via [football-data.org](https://www.football-data.org/) (free API key), falling back to a built-in static schedule when no key is configured
- ▶️ **HLS player** — hls.js with native Safari fallback, multi-source switching, and friendly error handling for flaky public streams

> **Legal note:** This app does not host or distribute video. Add only streams to your curated list that you are legally allowed to watch (e.g. official free broadcaster streams in your country). Public channels come from iptv-org, which indexes publicly available streams and honors takedown requests.

## Quick start

```bash
npm install
copy .env.example .env.local   # optional: add your football-data.org key
npm run dev
```

Open http://localhost:3000.

## Adding your own channels

Edit [data/channels.json](data/channels.json):

```json
{
  "id": "my-channel",
  "name": "My Channel",
  "featured": true,
  "country": "BD",
  "logo": "https://example.com/logo.png",
  "description": "Optional description.",
  "streams": [
    { "url": "https://example.com/stream/master.m3u8", "quality": "1080p", "label": "Main" }
  ]
}
```

- `id` must be unique (it becomes the `/watch/<id>` URL)
- `streams` accepts multiple entries — viewers can switch sources if one fails
- Use **https** stream URLs only; http streams are blocked by browsers on an https site
- `country` is an ISO 3166-1 alpha-2 code (used for the flag), or `null`

## Live scores (optional)

1. Register free at https://www.football-data.org/client/register
2. Put the key in `.env.local` as `FOOTBALL_DATA_API_KEY=...`
3. Restart the dev server — `/api/matches` now returns `"source": "api"` with live data

Without a key the app uses `data/fixtures-fallback.json` (regenerate it any time with `node scripts/generate-fixtures.mjs`).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it at https://vercel.com/new (defaults work — Next.js is auto-detected)
3. In **Project Settings → Environment Variables**, add `FOOTBALL_DATA_API_KEY` (Production + Preview)
4. Deploy

## Architecture notes

- **Video never touches the server** — streams play directly from the source CDN to the browser; serverless functions only serve small filtered JSON
- The multi-MB iptv-org index files exceed Vercel's per-entry Data Cache limit, so caching happens at the **route output level** (ISR): `/api/channels` revalidates hourly, `/api/matches` every 60 s
- Server-side revalidation keeps football-data.org usage at ~1 request/min sitewide — well under the free tier's 10 req/min
- Public streams are pre-filtered: https-only, no custom Referer/User-Agent requirements (browsers can't send those), NSFW/closed channels removed

## Why do some streams fail?

Public iptv-org channels are a volunteer-maintained index of publicly available streams, so a sizable share is broken at any given moment (a measured sample on 2026-06-11 found roughly 35–65 % of sources failing). The player auto-skips dead sources at startup and marks them with ⚠. The causes, in order of frequency:

1. **Dead links** — the provider rotated or removed the URL; the server answers 400/404/504 or nothing at all
2. **Geo-blocking** — the broadcaster only allows certain countries; the server answers 403 for everyone else
3. **Server-side limits** — rate limiting (503), broken TLS certificates, overloaded origins
4. **Missing CORS headers** — the stream plays in VLC but the browser refuses it (rare here, because the app pre-filters most of these; Safari's native HLS can still play them)

To diagnose any specific stream yourself:

```bash
node scripts/probe-stream.mjs "https://example.com/stream/master.m3u8"
```

It follows the stream like a browser would (master playlist → variant → first segment, with an `Origin` header) and prints the HTTP status and CORS header at each hop.

## Known limitations

- Public iptv-org streams come and go — your curated channels are the reliable tier
- Free-tier football-data.org scores can lag a few minutes behind live
