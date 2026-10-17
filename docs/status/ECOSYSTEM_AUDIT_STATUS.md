# Ecosystem audit: OptiRadar Web checkpoint

Branch `claude/project-thread-0cf20u`. The server side is in the `optiradar` repository
(`docs/status/ECOSYSTEM_AUDIT_STATUS.md`, `docs/governance.md`). Status: CONFIRMED / ALREADY_FIXED / NOT_REPRODUCIBLE /
FIXED_AND_TESTED / BLOCKED.

| Id | Finding | Status | Evidence | Tests | Remaining |
|---|---|---|---|---|---|
| R08/A25 (UI) | Admin Tenant manages users and roles from Radar | FIXED_AND_TESTED | `src/settings/access/*` (users, roles, gate), routes `settings/access/{users,roles}` in `src/Navigation.jsx`, menu in `settings/components/SettingsMenu.jsx`, `common/util/useGovernance.js` | browser check 1440/820/390 (36 checks, mock server) | none |
| A12 (part) | API errors lose their meaning | FIXED_AND_TESTED | `common/util/ApiError.js`, `fetchOrThrow.js`, `describeError.js`, `common/components/StateView.jsx`, `MessageHandler` translates server codes | browser check (unavailable, forbidden with reference) | R5 batch |
| A29/R06 (UI) | Product switcher and tenant hint | FIXED_AND_TESTED | `common/components/ProductSwitcher.jsx` (account menu on mobile/desktop main page, apps button in the desktop `PageLayout` drawer), `common/util/useProducts.js` (server list only, fresh on open and before leaving, nothing listed on failure, legacy provider list only without central governance), `common/util/tenantHint.js` + `Navigation.jsx` (capture and strip `?tenant_hint`), `login/LoginPage.jsx` (one auto-start with the hint), `GovernanceController.jsx` (hint for another tenant while signed in starts one sign-in; always used up) | `npm test` (16, Node test runner), browser check 1440/820/390 (40 checks) | none |
| A12 (part) | Session end handling | FIXED_AND_TESTED | `common/util/fetchOrThrow.js` announces a 401 on any signed-in call (not `/api/session*`), `common/components/SessionGuard.jsx` clears the user, `LoginPage` says why (`governance_access_revoked` or expired) | `tests/unit/session.test.js`, browser check (access ended from the switcher) | R5 batch for the rest |
| i18n | `t(key)` returned nothing for a key a language lacks | FIXED_AND_TESTED | `LocalizationProvider.jsx` falls back to English; new keys exist in en and id | browser check (id) | other languages fall back to English |

## Commands run

* `npm run lint` clean; `npm test` 16 passed (`tests/unit`, Node test runner, no new dependency); `npx vite build` ok (see R5 for sizes).
* Browser: mock OptiRadar server (`/tmp` scratch, not committed) + `vite` dev server, Playwright Chromium at 1440, 820
  and 390: empty, loading, unavailable (503 with Retry-After and reference), forbidden, gate without permission, governance
  off, create role, add user, Indonesian text. 36/36 passed; screenshots not stored in the repository.
* Browser, switcher (same setup): list without current product or portal, fresh on open, revalidation before leaving, product
  removed meanwhile, OptiNexus outage with reference and retry, access ended (back to login with the reason), tenant hint
  (lower-cased, invalid dropped, other tenant while signed in, no loop after a failed sign-in). 40/40 passed.

## Decisions

* The access pages exist only while the server reports `governed: true` and the user holds `optiradar.access.manage`
  (`/api/governance/context`); this is a courtesy, the server enforces again.
* Requests and answers of the access screens are the OptiNexus delegation documents (snake_case) relayed by OptiRadar.
* A click with a modifier key (new tab) follows the link without the extra revalidation: the other product decides access
  itself. A plain click revalidates with OptiNexus first and stays here, with a message, when it cannot be confirmed.
* The tenant hint is kept in `sessionStorage` only until it is used once; a hint for another tenant while signed in uses the
  documented "one active tenant per account" move (earlier web sessions of the account end).
