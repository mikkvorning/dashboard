# DataDein Dashboard Prototype

Standalone React + Vite dashboard prototype intended for WordPress embedding.

## Stack

- React 18 (required by Tremor)
- Tremor UI charts/components
- Tailwind CSS (preflight disabled to reduce WordPress theme conflicts)
- Vite for build output

## Local Development

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

Vite reads `VITE_ASSET_BASE` for production asset paths through [vite.config.ts](vite.config.ts).

Example:

```powershell
$env:VITE_ASSET_BASE = '/wp-content/uploads/datadein-dashboard/'
npm run build
```

## Data Contract

- Runtime range data: [public/data/1Y.json](public/data/1Y.json), [public/data/3Y.json](public/data/3Y.json), and [public/data/ALL.json](public/data/ALL.json)
- Fallback/initial state: [src/data/snapshot.ts](src/data/snapshot.ts)

The dashboard resolves the currently selected range at runtime and loads the matching JSON payload from the public data directory. The shipped project does not include the internal conversion pipeline used during development.

## WordPress Embed (Elementor First Pass)

1. Upload built files from `dist` to a public path on the WordPress site.
2. Insert this mount container in an Elementor HTML widget:

```html
<div id="datadein-dashboard-root"></div>
```

3. Load CSS and JS from the uploaded `dist/assets` files:

```html
<link
  rel="stylesheet"
  href="/wp-content/uploads/datadein-dashboard/assets/index-xxxxx.css"
/>
<script
  type="module"
  src="/wp-content/uploads/datadein-dashboard/assets/index-xxxxx.js"
></script>
```

For production hardening, this same mount contract can later be switched to a small enqueue-based plugin without changing React app code.
