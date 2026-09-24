# YouPlayer Web (`youplayer-web`)

> **100% Free & Open Source YouTube Client for Web, Desktop & Mobile.**  
> Zero YouTube API Key required · Hosted directly on **GitHub Pages** · Persistent offline storage with IndexedDB · Full PWA installation support.

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Compliant-brightgreen.svg)](manifest.json)
[![Hosting](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue.svg)](https://pages.github.com)

---

## 🌟 Key Features

1. **100% Free & Privacy-Friendly**:
   - Uses the public **Piped API** with automatic latency routing and failover.
   - Requires **no Google API keys** or credentials.
   - Privacy-enhanced YouTube embed player without tracking cookies.

2. **Responsive YouTube-Style Dark Theme**:
   - Sleek **charcoal and slate** palette designed for low-light viewing and OLED displays.
   - Pixel-perfect responsive interface optimized for Mobile phones, Tablets, and Desktop screens.

3. **Persistent Local Data with IndexedDB**:
   - Watch History with exact timestamp progress resumes.
   - Custom Saved Playlists (*Watch Later*, *Favorites*, and user-created collections).
   - Timestamp Bookmarks with private notes for study and research.
   - Offline cache support for videos and metadata.

4. **Personalized Activity Dashboard**:
   - Real-time metrics: Total watch hours and minutes, videos completed, and playlist counts.
   - Weekly watch time activity distribution chart.
   - Subject & category breakdown with "Continue Watching" shelf.

5. **Task Reminders & Browser Push Alerts**:
   - Schedule alerts for study sessions or videos to watch later.
   - Native browser Web Push notifications with soft synthesized Web Audio chimes.

6. **Cross-Device & Cloud Sync**:
   - Seamlessly export encrypted Base64 sync codes between mobile devices, tablets, and desktop computers.
   - Full JSON data export and import for local backups.

7. **Multi-Language Internationalization (i18n)**:
   - Full localized support for **English**, **Español**, **Français**, **Deutsch**, **日本語**, **Português**, **中文**, and **हिन्दी**.

8. **OAuth External Provider Login**:
   - Support for Google, GitHub, and Discord authentication profiles or guest local profiles.

9. **Progressive Web App (PWA)**:
   - Web App Manifest (`manifest.json`) and Service Worker (`sw.js`).
   - Installable on Windows, macOS, Linux, ChromeOS, iOS Safari, and Android Chrome.

---

## 🚀 Step-by-Step: Publish on GitHub Pages in 3 Minutes

You can host **YouPlayer Web** directly on GitHub Pages with **zero server costs**:

### Option A: Deploy Single-File `index.html` (Fastest)

1. **Create a GitHub Repository**:
   - Name your repository: `youplayer-web`.
   - Set visibility to **Public**.

2. **Add `index.html`**:
   - Open YouPlayer Web and click **"GitHub Pages HTML"** in the top navigation bar.
   - Click **Download Standalone index.html**.
   - Commit `index.html` directly into the root of your `youplayer-web` repository.

3. **Enable GitHub Pages**:
   - Go to your repository's **Settings** tab.
   - Click **Pages** in the left sidebar.
   - Under **Build and deployment > Branch**, select `main` (or `master`) and directory `/ (root)`.
   - Click **Save**.

4. **Your App is Live!**
   - After 1–2 minutes, your web application will be accessible at:  
     `https://<your-username>.github.io/youplayer-web/`

---

### Option B: Build and Deploy from Source (Vite SPA)

```bash
# 1. Clone this repository
git clone https://github.com/anyelo888ra-ux/youplayer-web/
cd youplayer-web

# 2. Install dependencies
npm install

# 3. Test locally
npm run dev

# 4. Build production static bundle
npm run build
```

Then deploy the generated `dist/` folder using the standard GitHub Pages Action:
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| `Space` / `K` | Play / Pause |
| `J` | Rewind 10 seconds |
| `L` | Fast-forward 10 seconds |
| `M` | Toggle Mute |
| `F` | Toggle Fullscreen |
| `T` | Toggle Theater Mode |

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).  
Copyright (c) 2026 YouPlayer Web Contributors.
