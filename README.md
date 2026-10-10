# OptiRadar Web App

## Overview

This is the browser-based tracking dashboard for OptiRadar, the connected vehicle tracking platform of the Opti
product family. It's a React, Material UI, and MapLibre single-page app that talks to the
[OptiRadar server](https://github.com/gsiddik/OptiRadar) over its REST API, providing the live map, reports,
geofences, and device management UI.

This repository is the front-end only. The server build stages a built copy of this app as its web interface
(`web.path` in the server configuration).

OptiRadar can sign users in through OptiNexus (OpenID Connect). When it does, the account menu lists the other
applications OptiNexus lets the user open, and signing out continues to OptiNexus so the user is signed out
everywhere. See `docs/optinexus-sso.md` in the server repository.

| Sign-in page |
|---|
| ![OptiRadar sign-in page](.github/screenshot.png) |

## Development

```shell
npm install
npm start
```

This starts a local dev server (Vite) on port 3000 that proxies API requests to an OptiRadar server running on
`http://localhost:8082`.

To build a production bundle:

```shell
npm run build
```

## Branding

- Logo: `src/resources/images/logo.png`, plus `logo-inverted.png` for dark backgrounds. A server can still override
  them with the `logo` and `logoInverted` server attributes.
- App icons: `public/favicon.ico`, `public/pwa-*.png`, `public/maskable-icon-512x512.png` and
  `public/apple-touch-icon-180x180.png`.
- Window title and description come from the server `title` and `description` attributes (default "OptiRadar").

The brand sources live in `branding/` (`optiradar-logo.png`, `optiradar-emblem.png`). After changing them, run
`npm run generate-brand-assets` (Python 3 with Pillow and NumPy) to rebuild the logo and every icon size.

## Credits and license

OptiRadar Web is based on the open source [Traccar Web App](https://github.com/traccar/traccar-web) by Anton
Tananaev and Andrey Kunitsyn. It is distributed under the Apache License, Version 2.0; see [LICENSE.txt](LICENSE.txt).
