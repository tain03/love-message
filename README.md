## Love Galaxy (mobile-first)

An interactive “I Love You” heart animation floating in a starfield galaxy background. The site is tuned for mobile (iPhone 11 and similar) but looks great on desktop too. Music autoplay is supported with a soft prompt when browsers block it.

### Features
- Starfield + nebula background, fills the whole screen
- Animated multi-language “I Love You” heart path
- Mobile scaling and safe-area handling; iPhone 11 optimized
- Music controls: Play/Pause (▶/⏸), Next track (≫)
- Autoplay helper overlay when blocked by the browser

### Project structure
```
loveyou/
  index.html       # HTML skeleton
  app.css          # All styles, animations, responsive rules
  app.js           # Effects, scaling, starfield, audio, controls
  xinloi.mp3       # Track 1 (default)
  truockhiemtontai.mp3
  lancuoi.mp3
```

### Run locally
1) From the `loveyou` folder, start any static server:
   - Python: `python -m http.server 5500 --bind 0.0.0.0`
   - Node (http-server): `npx http-server -p 5500 -a 0.0.0.0`
   - VS Code Live Server: Start at folder root

2) Open on your computer: `http://localhost:5500/` (or the URL from your server)

3) Open on your phone (same Wi‑Fi): find your PC IPv4 (Windows: `ipconfig`), then visit for example:
```
http://<your-ip>:5500/
```

Notes
- iOS/Android may block autoplay with sound until a first tap. The site shows a small hint “Nhấn để bật âm thanh ♪”.

### Deploy to GitHub Pages
This is a static site; any static hosting works. For GitHub Pages:
1) Push the `loveyou` folder as your repo root (or keep it as the repo root itself).
2) In Settings → Pages, choose “Deploy from a branch” (main, root) or “GitHub Actions”.


### Controls
- ▶/⏸: Play/Pause current track
- ≫: Next track (cycles through the 3 mp3 files)

### Customize
- Heart scale (shrink/expand entire heart path): in `index.html`, adjust `--heart-scale` on `#ui`, default `0.75`.
- Default element count and speed: in `app.js` (`this.count = 100`, `this.speed = 1.0`).
- Star density: in `createGalaxyBackground()` (`starCount` and `shootingStarCount`).
- Tracks: edit `this.tracks` in `app.js` to add/remove mp3 files.



