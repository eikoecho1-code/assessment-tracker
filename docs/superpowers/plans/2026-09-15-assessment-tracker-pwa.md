# Assessment Tracker PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Assessment Tracker HTML dashboard into an installable offline-capable PWA named Assessment Tracker.

**Architecture:** Preserve the current dashboard as `index.html` and add a manifest, service worker, local app icons, and deployment configuration. Keep workbook selection and processing entirely client-side; the PWA layer only caches application assets.

**Tech Stack:** HTML/CSS/JavaScript, Web App Manifest, Service Worker/Cache API, SheetJS already used by the dashboard, Chart.js already used by the dashboard, Node.js static smoke tests, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-09-15-assessment-tracker-pwa-design.md`

## Global Constraints

- Installed app name is `Assessment Tracker`.
- Use the approved hand-drawn muted dashboard-owl artwork for app icons.
- Preserve the existing spreadsheet loader and dashboard behavior.
- Student workbook data stays on the user's device and is not uploaded by the PWA layer.
- Version 1 adds no accounts, cloud storage, synchronization, or database.
- App shell must reopen offline after one successful online visit.

---

### Task 1: Create the PWA project shell

**Files:**
- Create: `index.html`
- Create: `tests/pwa-smoke.test.js`
- Copy from: current `Assessment_Tracker_Owlumi_Cropped_Logos.html`

**Interfaces:**
- Consumes: existing single-file Assessment Tracker HTML.
- Produces: `index.html` with the existing `#file` spreadsheet input and dashboard JavaScript intact.

- [ ] **Step 1: Copy the approved dashboard to `index.html` and write the failing smoke test**

```js
const fs = require("node:fs");
const assert = require("node:assert");

const html = fs.readFileSync("index.html", "utf8");

assert.match(html, /id="file"[^>]*type="file"/);
assert.match(html, /Load Spreadsheet/);
assert.match(html, /manifest\.webmanifest/);
assert.match(html, /serviceWorker\.register/);
```

- [ ] **Step 2: Run the smoke test and verify the PWA metadata assertions fail**

Run:

```bash
node tests/pwa-smoke.test.js
```

Expected: failure because the manifest link and service-worker registration do not exist yet.

- [ ] **Step 3: Verify the copied dashboard JavaScript before changing it**

Extract inline scripts to a temporary file and run:

```bash
node --check tests/extracted-dashboard.js
```

Expected: exit code 0.

- [ ] **Step 4: Commit the preserved baseline**

```bash
git add index.html tests/pwa-smoke.test.js
git commit -m "chore: establish assessment tracker pwa baseline"
```

### Task 2: Add app manifest and install identity

**Files:**
- Create: `manifest.webmanifest`
- Modify: `index.html`
- Modify: `tests/pwa-smoke.test.js`

**Interfaces:**
- Consumes: `index.html`.
- Produces: install metadata at `/manifest.webmanifest`.

- [ ] **Step 1: Extend the smoke test to validate manifest fields**

```js
const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
assert.equal(manifest.name, "Assessment Tracker");
assert.equal(manifest.short_name, "Assessment Tracker");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/");
assert.ok(manifest.icons.some(i => i.sizes === "192x192"));
assert.ok(manifest.icons.some(i => i.sizes === "512x512"));
```

- [ ] **Step 2: Run the test and verify it fails because the manifest does not exist**

Run:

```bash
node tests/pwa-smoke.test.js
```

Expected: ENOENT for `manifest.webmanifest`.

- [ ] **Step 3: Create the manifest**

```json
{
  "name": "Assessment Tracker",
  "short_name": "Assessment Tracker",
  "description": "Local-first assessment analytics for teachers.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#eef8ff",
  "theme_color": "#173f7a",
  "icons": [
    {"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
```

Add to `<head>`:

```html
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#173f7a">
```

- [ ] **Step 4: Run the smoke test**

Run:

```bash
node tests/pwa-smoke.test.js
```

Expected: manifest assertions pass; service-worker assertion still fails.

- [ ] **Step 5: Commit**

```bash
git add index.html manifest.webmanifest tests/pwa-smoke.test.js
git commit -m "feat: add assessment tracker install manifest"
```

### Task 3: Generate install icons from the approved artwork

**Files:**
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`
- Create: `icons/icon-maskable-512.png`
- Modify: `tests/pwa-smoke.test.js`

**Interfaces:**
- Consumes: approved transparent dashboard-owl PNG.
- Produces: square PNG install assets referenced by the manifest.

- [ ] **Step 1: Add icon existence checks**

```js
for (const path of [
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
]) {
  assert.ok(fs.existsSync(path), `${path} must exist`);
}
```

- [ ] **Step 2: Run the test and verify it fails on missing icons**

Run:

```bash
node tests/pwa-smoke.test.js
```

Expected: assertion failure naming the first missing icon.

- [ ] **Step 3: Generate icons without redrawing the artwork**

Use the approved transparent PNG as the source. Fit the entire foreground inside a square transparent canvas, preserving aspect ratio. Export exact 192×192 and 512×512 files. For the maskable icon, keep the complete owl/dashboard artwork inside the central safe zone rather than cropping feathers, feet, books, or dashboard edges.

- [ ] **Step 4: Verify exact dimensions**

Run a small image-dimension check and require:

```text
icon-192.png          192 x 192
icon-512.png          512 x 512
icon-maskable-512.png 512 x 512
```

- [ ] **Step 5: Run the smoke test and commit**

```bash
node tests/pwa-smoke.test.js
git add icons tests/pwa-smoke.test.js
git commit -m "feat: add assessment tracker app icons"
```

### Task 4: Add offline app-shell service worker

**Files:**
- Create: `service-worker.js`
- Modify: `index.html`
- Modify: `tests/pwa-smoke.test.js`

**Interfaces:**
- Consumes: static PWA assets.
- Produces: cache named `assessment-tracker-v1` and service-worker registration from `index.html`.

- [ ] **Step 1: Add service-worker static checks**

```js
const sw = fs.readFileSync("service-worker.js", "utf8");
assert.match(sw, /assessment-tracker-v1/);
assert.match(sw, /manifest\.webmanifest/);
assert.match(sw, /icons\/icon-192\.png/);
assert.match(html, /navigator\.serviceWorker/);
assert.match(html, /serviceWorker\.register\(["']\/service-worker\.js["']\)/);
```

- [ ] **Step 2: Run the test and verify it fails because the service worker is missing**

```bash
node tests/pwa-smoke.test.js
```

Expected: ENOENT for `service-worker.js`.

- [ ] **Step 3: Implement the minimal service worker**

```js
const CACHE = "assessment-tracker-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
    )
  );
});
```

Register it at the end of `index.html`:

```html
<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}
</script>
```

- [ ] **Step 4: Run syntax and smoke checks**

```bash
node --check service-worker.js
node tests/pwa-smoke.test.js
```

Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html service-worker.js tests/pwa-smoke.test.js
git commit -m "feat: add offline assessment tracker shell"
```

### Task 5: Make core dashboard dependencies offline-safe

**Files:**
- Modify: `index.html`
- Create if required: `vendor/xlsx.full.min.js`
- Create if required: `vendor/chart.umd.min.js`
- Modify: `service-worker.js`
- Modify: `tests/pwa-smoke.test.js`

**Interfaces:**
- Consumes: the exact SheetJS and Chart.js versions currently referenced by `index.html`.
- Produces: locally served/cacheable core runtime dependencies.

- [ ] **Step 1: Inspect `index.html` for external script URLs**

Run:

```bash
grep -nE '<script[^>]+src="https?://' index.html
```

Expected: identify the exact SheetJS/Chart.js CDN dependencies, if present.

- [ ] **Step 2: Add a test that core runtime scripts are not remote**

```js
const remoteCore = [...html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)]
  .map(m => m[1])
  .filter(url => /xlsx|sheetjs|chart/i.test(url));
assert.deepEqual(remoteCore, []);
```

- [ ] **Step 3: Run the test and verify it fails if core libraries are remote**

```bash
node tests/pwa-smoke.test.js
```

Expected: failure listing remote core library URLs when they exist.

- [ ] **Step 4: Vendor only the required current library builds**

Download/copy the exact versions already used by the approved dashboard into `vendor/`, replace their `<script src>` values with local paths, and add those local paths to `APP_SHELL`. Do not upgrade library versions as part of this conversion.

- [ ] **Step 5: Run tests and commit**

```bash
node tests/pwa-smoke.test.js
node --check service-worker.js
git add index.html service-worker.js vendor tests/pwa-smoke.test.js
git commit -m "feat: cache dashboard runtime dependencies"
```

### Task 6: Add Vercel static deployment configuration and final verification

**Files:**
- Create: `vercel.json`
- Modify: `tests/pwa-smoke.test.js`

**Interfaces:**
- Consumes: completed static PWA.
- Produces: HTTPS-deployable Assessment Tracker project.

- [ ] **Step 1: Add deployment smoke checks**

```js
const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
assert.ok(Array.isArray(vercel.headers));
assert.ok(vercel.headers.some(rule =>
  rule.source === "/service-worker.js"
));
```

- [ ] **Step 2: Run test and verify it fails because deployment config is missing**

```bash
node tests/pwa-smoke.test.js
```

Expected: ENOENT for `vercel.json`.

- [ ] **Step 3: Create static headers for the service worker and manifest**

```json
{
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {"key": "Cache-Control", "value": "public, max-age=0, must-revalidate"}
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        {"key": "Content-Type", "value": "application/manifest+json"}
      ]
    }
  ]
}
```

- [ ] **Step 4: Run all static verification**

```bash
node tests/pwa-smoke.test.js
node --check service-worker.js
```

Then serve locally over HTTP and verify in a Chromium browser:

```bash
npx serve .
```

Manual acceptance:
- Open the local URL.
- Load a known `.xlsx` tracker and confirm class cards render.
- Open a student profile and confirm charts/component table render.
- Confirm Print View still opens/prints correctly.
- In browser application tools, confirm manifest name is `Assessment Tracker`.
- Confirm service worker reaches activated/running state.
- Switch browser network to Offline and reload; confirm the app shell opens.
- Confirm the workbook is still selected locally through the file picker.

- [ ] **Step 5: Commit**

```bash
git add vercel.json tests/pwa-smoke.test.js
git commit -m "chore: prepare assessment tracker pwa deployment"
```
