# Cybernav Pro — Hosting Guide for IT Team

**Version:** 2.0 (Prototype)
**Stack:** React 18 + Vite + Recharts
**Type:** Static Single-Page Application (SPA) — no backend, no database required

---

## What This Is

Cybernav Pro is a browser-based cyber assessment tool with two modules:

- **Governance** — Cyber Maturity Assessment (CMA) across 9 domains (CY.1–CY.9) using CMMI scoring, FAIR-based Cyber Risk Quantification, benchmark comparison, and a dynamic improvement roadmap.
- **Compliance** — Regulatory readiness assessment for PDPA, SC GTRM, NACSA COP, and BNM RMiT with weighted gap scoring.

All data stays in the browser — nothing is sent to a server.

---

## Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 18.x or higher | `node -v` |
| npm | 9.x or higher | `npm -v` |

Download Node.js from: https://nodejs.org (LTS version recommended)

---

## Option A — Vercel (Recommended, Fastest)

This is the simplest path. Vercel is free for this use case.

1. Push this folder to a GitHub repository (private or public).
2. Go to https://vercel.com/new and log in.
3. Click **Import Git Repository** and select the repo.
4. Vercel auto-detects Vite — no settings need to be changed.
5. Click **Deploy**.

Your live URL will be ready in ~60 seconds (e.g., `cybernav-pro.vercel.app`).

Every `git push` to `main` triggers an automatic redeploy.

---

## Option B — Build & Host on Your Own Server (Nginx / Apache / IIS)

### Step 1 — Install dependencies

```bash
cd cybernav-pro
npm install
```

### Step 2 — Build the production bundle

```bash
npm run build
```

This creates a `dist/` folder containing static files (HTML, JS, CSS). The build takes ~30 seconds.

### Step 3 — Serve the dist/ folder

**Nginx (recommended)**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/cybernav-pro/dist;
    index index.html;

    # Required for React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache**

Create a `.htaccess` file inside `dist/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

**IIS (Windows Server)**

Add a `web.config` inside `dist/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## Option C — Quick Local Preview (for testing only)

```bash
cd cybernav-pro
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Folder Structure

```
cybernav-pro/
├── index.html          # App entry point
├── package.json        # Dependencies and scripts
├── vite.config.js      # Build configuration
├── .gitignore
└── src/
    ├── main.jsx        # React root mount
    └── App.jsx         # Full application (all screens, logic, data)
```

After running `npm run build`, a `dist/` folder is generated — this is what you deploy.

---

## Environment & Security Notes

- **No backend required.** The app is entirely client-side. No API keys, no database connections, no server-side processing.
- **No data leaves the browser.** All assessment responses are held in React state and cleared on page refresh. There is no persistence layer in this version.
- **HTTPS recommended.** Deploy behind HTTPS in production. Vercel provides this automatically. For self-hosted, use Let's Encrypt or your organisation's SSL certificate.
- **Document upload (AI rating):** In this prototype version, document uploads are simulated client-side. Full AI-powered document parsing (connecting to Claude/OpenAI API) requires a backend API and is available in the production version.

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start local dev server (hot reload) |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| recharts | ^2.12.7 | Radar and bar charts on dashboard |
| vite | ^5.4.2 | Build tool |
| @vitejs/plugin-react | ^4.3.1 | React JSX transform for Vite |

---

## Updating the App

All application logic, data, and UI lives in a single file: `src/App.jsx`. To update content (requirements, benchmarks, control descriptions, recommendations) edit that file and rebuild.

---

## Support

For questions about this application, contact the product owner.
For hosting infrastructure issues, refer to your standard web server runbooks.
