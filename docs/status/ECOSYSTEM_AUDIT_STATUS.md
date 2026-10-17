# Ecosystem audit: OptiRadar Web checkpoint

Branch `claude/project-thread-0cf20u`. The server side is in the `optiradar` repository
(`docs/status/ECOSYSTEM_AUDIT_STATUS.md`, `docs/governance.md`). Status: CONFIRMED / ALREADY_FIXED / NOT_REPRODUCIBLE /
FIXED_AND_TESTED / BLOCKED.

| Id | Finding | Status | Evidence | Tests | Remaining |
|---|---|---|---|---|---|
| R08/A25 (UI) | Admin Tenant manages users and roles from Radar | FIXED_AND_TESTED | `src/settings/access/*` (users, roles, gate), routes `settings/access/{users,roles}` in `src/Navigation.jsx`, menu in `settings/components/SettingsMenu.jsx`, `common/util/useGovernance.js` | browser check 1440/820/390 (36 checks, mock server) | none |
| A12 (part) | API errors lose their meaning | FIXED_AND_TESTED | `common/util/ApiError.js`, `fetchOrThrow.js`, `describeError.js`, `common/components/StateView.jsx`, `MessageHandler` translates server codes | browser check (unavailable, forbidden with reference) | none (see A12 render errors) |
| A29/R06 (UI) | Product switcher and tenant hint | FIXED_AND_TESTED | `common/components/ProductSwitcher.jsx` (account menu on mobile/desktop main page, apps button in the desktop `PageLayout` drawer), `common/util/useProducts.js` (server list only, fresh on open and before leaving, nothing listed on failure, legacy provider list only without central governance), `common/util/tenantHint.js` + `Navigation.jsx` (capture and strip `?tenant_hint`), `login/LoginPage.jsx` (one auto-start with the hint), `GovernanceController.jsx` (hint for another tenant while signed in starts one sign-in; always used up) | `npm test` (16, Node test runner), browser check 1440/820/390 (40 checks) | none |
| A12 (part) | Session end handling | FIXED_AND_TESTED | `common/util/fetchOrThrow.js` announces a 401 on any signed-in call (not `/api/session*`), `common/components/SessionGuard.jsx` clears the user, `LoginPage` says why (`governance_access_revoked` or expired) | `tests/unit/session.test.js`, browser check (access ended from the switcher) | none |
| i18n | `t(key)` returned nothing for a key a language lacks | FIXED_AND_TESTED | `LocalizationProvider.jsx` falls back to English; new keys exist in en and id | browser check (id) | other languages fall back to English |
| A12 (render errors) | A failing page showed a raw stack (`ErrorBoundary` printed `error.stack`) or blanked the window | FIXED_AND_TESTED | `src/ErrorBoundary.jsx` (global, loads its own words, hides the page loader), `common/components/{ErrorBoundary,RouteErrorBoundary,ErrorScreen}.jsx`, `common/util/runtimeError.js`; route boundary around `<Outlet/>` in `App.jsx` (shell, socket, bottom menu stay) and around the routes in `Navigation.jsx`; own boundary for the map in `main/MainPage.jsx`; unexpected errors show `UI-XXXXXXXX` (also in the console), server errors keep their correlation id | `tests/unit/runtimeError.test.js` (9), browser B1-B6 below | no client error report endpoint exists: the reference is only in the browser console (owner decision) |
| A15 (stale files) | Old tab asks for a page file the new deploy removed; `onerror` on the entry script is dropped by Vite in the built page, so a missing entry file gave a blank page | FIXED_AND_TESTED | `isChunkLoadError` (Chrome, Firefox, Safari, Vite CSS wording), `ErrorBoundary.componentDidCatch` reloads once (guard `sessionStorage.staleReloadAt`, 5 min), `reloadToLatest` drops the service worker and caches first when online (a plain reload would be served the old page by the old worker), offline only reloads; `index.html` capture listener shows a bilingual message with Reload when the entry script fails | browser B2-B6 | service worker upgrade flow: see Half done |
| A15 (bundle) | Map library (maplibre, 1.1 MB source) was in the first screen chunk and created a map on `/login` | FIXED_AND_TESTED | `map/core/mapCoordinates.js` (no static import of `MapView`), `MapView` lazy through `MainMap` | build before/after, browser measure, map check 1440/820/390 | see Measured |

## Commands run

* `npm run lint` clean; `npm test` 25 passed (`tests/unit`, Node test runner, no new dependency); `npx vite build` ok (273 precache entries).
* Browser: mock OptiRadar server (`/tmp` scratch, not committed) + `vite` dev server, Playwright Chromium at 1440, 820
  and 390: empty, loading, unavailable (503 with Retry-After and reference), forbidden, gate without permission, governance
  off, create role, add user, Indonesian text. 36/36 passed; screenshots not stored in the repository.
* Browser, switcher (same setup): list without current product or portal, fresh on open, revalidation before leaving, product
  removed meanwhile, OptiNexus outage with reference and retry, access ended (back to login with the reason), tenant hint
  (lower-cased, invalid dropped, other tenant while signed in, no loop after a failed sign-in). 40/40 passed.

* Browser B1-B6 (production build behind a gzip static server, mock server, Playwright Chromium, service worker blocked,
  1440/820/390, 80 checks, all PASS): B1 render error (friendly screen, reference equal to the console one, no stack, shell and
  websocket alive, retry recovers, route change clears), B2 missing page file (stale screen, one automatic reload only,
  manual reload, works once the file is back), B3 same offline (no automatic reload, works back online), B4 missing map file
  (device list keeps working), B5 missing entry script (en and id text, reload starts the app), B6 translation file missing
  (global screen, loader hidden). Map check: map canvas, websocket open, no page errors at 1440/820/390 (3/3 PASS).
* Scratch scripts and screenshots live in `/tmp/claude-0/web-smoke` (not committed).

## Decisions

* The access pages exist only while the server reports `governed: true` and the user holds `optiradar.access.manage`
  (`/api/governance/context`); this is a courtesy, the server enforces again.
* Requests and answers of the access screens are the OptiNexus delegation documents (snake_case) relayed by OptiRadar.
* A click with a modifier key (new tab) follows the link without the extra revalidation: the other product decides access
  itself. A plain click revalidates with OptiNexus first and stays here, with a message, when it cannot be confirmed.
* The tenant hint is kept in `sessionStorage` only until it is used once; a hint for another tenant while signed in uses the
  documented "one active tenant per account" move (earlier web sessions of the account end).

## Measured (same build tool, HEAD before the map change vs after; Playwright, cold cache, gzip server)

* Entry chunk `index-*.js`: 1,559.82 kB raw / 445.51 kB gzip -> 470.04 kB / 149.33 kB. New lazy chunk `MapView` 1,080.41 kB /
  294.21 kB gzip (+ css 82.96 kB). Precache 271 -> 274 entries (7814.5 -> 7815.9 KiB).
* Mobile profile (1.6 Mbit/s, 150 ms RTT, CPU x4, median of 5): login usable 5552 -> 3744 ms (JS 597 -> 308 KB); main
  screen 5916 -> 4134 ms (requests 47 -> 50, JS 601 -> 603 KB: the map still loads there). Desktop: login 1053 -> 970 ms, main
  965 -> 954 ms. `MainPage` stays static (needed on the main screen; lazy would not shorten it).

## Route coverage (src/Navigation.jsx)

All routes except `/` and the shell `App` are `lazy`; all sit under a route boundary (public pages: Navigation level, signed-in
pages: App level, which keeps socket, session guard and bottom menu). Signed-in routes need the session (`App` redirects to
`/login`); the server enforces permission and entitlement per call (`@Governed`), the UI only hides.

| Routes | Boundary | Browser smoke |
|---|---|---|
| `/login`, `/register`, `/reset-password`, `/change-server` (4) | Navigation | login: PASS (switcher and bundle checks); others NOT_RUN |
| `/` main screen with map | App + map panel | PASS 1440/820/390 (map canvas, websocket, device list, B1-B4) |
| `/position/:id`, `/network/:positionId`, `/event/:id`, `/replay`, `/geofences`, `/emulator`, `/stream` (7) | App | NOT_RUN |
| `/settings/access/{users,roles}` (2, governed and `access.manage`) | App | PASS earlier (36 checks) |
| `/settings/groups`, `/settings/preferences` | App | PASS (B1 render error, B2/B3 file failure) |
| other `/settings/*` (39: devices, device, geofence, users, server, ...) | App | NOT_RUN |
| `/reports/*` (12: route, trips, stops, summary, events, geofences, chart, combined, scheduled, statistics, audit, logs) | App | NOT_RUN |

## Work state (owner paused Radar work; no new item started)

* Done: R1-R4 (server, see the optiradar status), web access pages, switcher, session end, typed errors, error boundaries,
  stale file recovery, entry failure page, map out of the first screen.
* Half done: stale file and service worker upgrade is analysed by reading only. With a service worker the old page keeps
  using its old precache, so a route change in an old tab works until the worker updates; after `updateServiceWorker(true)` in
  another tab, old files are gone and the boundary above takes over (tested without a worker, B2). NOT_RUN: old tab + new
  build + active worker, the `needRefresh` snackbar flow. Finding for ops: `web.cacheControl` default `max-age=3600,public`
  applies to `index.html` and `sw.js` too; serve those two with `no-cache` (proxy rule), otherwise a reload within the hour can
  still load an old page (the entry failure page and Reload then recover).
* Not started: smoke of platform (native operator) and tenant (central) roles on device, report and geofence screens; the
  remaining routes of the matrix; an endpoint to report client errors; lazy `MainPage`.
