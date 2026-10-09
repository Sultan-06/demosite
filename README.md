# Frame

A dark-themed movie and streaming library with a Watchmode-powered discovery page.

## Run locally

Requires Node.js 20 or later. From the project root:

1. Copy `.env.example` to `.env`.
2. Put a **new, rotated** Watchmode API key in `.env` as `WATCHMODE_API_KEY`.
3. Run `npm start` and open the local URL printed by the server (default `http://127.0.0.1:4173`).

The key is read by the Node server and is never sent to browser JavaScript. Do not put it in HTML, client-side scripts, or a `VITE_*` variable.

## Watchmode features

`Discover` provides title search by name and external identifier, autocomplete suggestions, catalog filters for genres, TV networks, media types, and region, plus a new-releases view. Opening a title loads its metadata, regional release dates, cast and crew, seasons, episodes, and regional streaming sources. Provider actions use Watchmode web links and any available iOS/Android app links. Search and details use the `/api` proxy rather than calling Watchmode from the browser.

The server caches API responses, serializes upstream requests (one per configured minimum interval), limits browser API requests per client, and validates API routes and input fields. The daily background sync checks Watchmode's new-title, metadata, episode, and streaming-source change feeds, stores the last result under the ignored `data/` directory, and invalidates cached details for changed titles. Change-feed access depends on the Watchmode account plan. The last sync state is shown on the Discover page; run `npm run sync` to trigger a one-time sync.

Tune the port, host, cache lifetime, upstream request spacing, maximum change-feed pages, and regions covered by the daily streaming-source sync with the variables in `.env.example`. The interactive region selector loads the countries supported by Watchmode independently of this sync setting.
