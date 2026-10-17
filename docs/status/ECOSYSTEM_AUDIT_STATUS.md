# Ecosystem audit: OptiRadar Web checkpoint

Branch `claude/project-thread-0cf20u`. The server side is in the `optiradar` repository
(`docs/status/ECOSYSTEM_AUDIT_STATUS.md`, `docs/governance.md`). Status: CONFIRMED / ALREADY_FIXED / NOT_REPRODUCIBLE /
FIXED_AND_TESTED / BLOCKED.

| Id | Finding | Status | Evidence | Tests | Remaining |
|---|---|---|---|---|---|
| R08/A25 (UI) | Admin Tenant manages users and roles from Radar | FIXED_AND_TESTED | `src/settings/access/*` (users, roles, gate), routes `settings/access/{users,roles}` in `src/Navigation.jsx`, menu in `settings/components/SettingsMenu.jsx`, `common/util/useGovernance.js` | browser check 1440/820/390 (36 checks, mock server) | none |
| A12 (part) | API errors lose their meaning | FIXED_AND_TESTED | `common/util/ApiError.js`, `fetchOrThrow.js`, `describeError.js`, `common/components/StateView.jsx`, `MessageHandler` translates server codes | browser check (unavailable, forbidden with reference) | R5 batch |
| i18n | `t(key)` returned nothing for a key a language lacks | FIXED_AND_TESTED | `LocalizationProvider.jsx` falls back to English; new keys exist in en and id | browser check (id) | other languages fall back to English |

## Commands run

* `npm run lint` clean; `npx vite build` (see R5 for sizes).
* Browser: mock OptiRadar server (`/tmp` scratch, not committed) + `vite` dev server, Playwright Chromium at 1440, 820
  and 390: empty, loading, unavailable (503 with Retry-After and reference), forbidden, gate without permission, governance
  off, create role, add user, Indonesian text. 36/36 passed; screenshots not stored in the repository.

## Decisions

* The access pages exist only while the server reports `governed: true` and the user holds `optiradar.access.manage`
  (`/api/governance/context`); this is a courtesy, the server enforces again.
* Requests and answers of the access screens are the OptiNexus delegation documents (snake_case) relayed by OptiRadar.
