# Assessment Tracker PWA Design

**Date:** 2026-09-15

## Goal

Convert the existing Assessment Tracker HTML dashboard into an installable Progressive Web App named **Assessment Tracker**, without changing its assessment-analysis workflow.

## Product identity

- Installed app name: **Assessment Tracker**
- Keep Owlumi as a subtle creator credit inside the dashboard.
- Use the approved hand-drawn, muted dashboard-owl artwork as the application icon.
- Do not present the installed app as an Owlumi game.

## Existing workflow to preserve

- The dashboard continues to load the companion Excel workbook from the teacher's own device.
- Student assessment data is processed locally in the browser.
- Loading a spreadsheet must not upload student data to Vercel.
- Existing class analytics, student profiles, charts, recommendations, teacher notes display, print view, and spreadsheet parsing remain intact.

## PWA architecture

The current dashboard becomes `index.html`. Add a web app manifest, service worker, and generated app-icon sizes. The application will be deployed over HTTPS using the user's existing GitHub → Vercel workflow.

The PWA launches in `standalone` display mode so supported devices open it like an application rather than a normal browser tab. The service worker caches the application shell and local static dependencies needed for the dashboard interface so the tracker can reopen after installation without a network connection.

The teacher still selects the Excel workbook from the device each time it is needed. Version 1 will not add accounts, cloud storage, synchronization, or a database.

## Files

- `index.html` — existing Assessment Tracker dashboard plus PWA metadata/registration.
- `manifest.webmanifest` — app identity, display mode, theme/background colors, icons.
- `service-worker.js` — app-shell caching and update behavior.
- `icons/icon-192.png` — install icon.
- `icons/icon-512.png` — install icon.
- `icons/icon-maskable-512.png` — safe-zone icon for platforms that mask icons.
- `vercel.json` — minimal static-host configuration only if needed.
- `tests/pwa-smoke.test.js` — static checks for manifest, service worker registration, required assets, and preservation of the spreadsheet loader.

## Offline behavior

The application shell should load offline after it has been visited successfully at least once. The service worker must not intercept or upload the workbook selected through the file input. Any external CDN dependency that is required for core spreadsheet parsing/chart rendering should be made locally cacheable or vendored so offline reopening remains useful.

## Privacy

No assessment workbook or student data is sent to a server by the PWA layer. Deployment hosts only the application assets.

## Acceptance criteria

1. The deployed site is installable as **Assessment Tracker** on supported PWA platforms.
2. The approved dashboard owl appears as the installed app icon.
3. Launching the installed app uses a standalone application window.
4. The existing `Load Spreadsheet` workflow still works.
5. Existing dashboard JavaScript remains syntactically valid.
6. The application shell can reopen offline after one successful online visit.
7. No account, cloud-storage, or database feature is introduced.
8. Student workbook contents remain local to the user's device.
