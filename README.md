# obin07 Photography (static gallery)

Lightweight responsive photo gallery built with HTML, CSS and vanilla JS.

Features
- Responsive thumbnail grid and two-column layout on desktop (thumbnails + main display).
- Dynamic image loading from `images.json` (no manual HTML edits when you add images).
- Accessible thumbnails (keyboard support, ARIA roles) and persisted last-viewed image.
- Dark-mode toggle with grayish tones matching the site's palette.

Quick start
1. Open `index.html` in a browser (or serve the folder via a local HTTP server).

Local preview (recommended)
```bash
# Python
python -m http.server 8000
# or Node (if you have http-server)
npx http-server -c-1 .
```

Adding images
1. Drop image files into the `images/` folder.
2. Regenerate `images.json` so the site sees the new files:
```bash
node scripts/generate-manifest.js
```
3. Reload the page — thumbnails and the main display will update automatically.

Implementation notes
- `images.json` is the gallery manifest used by `app.js` to build the UI.
- Above-the-fold images are loaded eagerly; others use `loading="lazy"` for performance.
- The main display uses `object-fit: cover` to keep images visually consistent; thumbnails are fixed to a `16:9` aspect ratio.
- For best performance at scale, consider generating multiple sizes and WebP variants and using `srcset`/`sizes` — I can add a script to generate these if you want.

Files of interest
- `index.html` — main markup and nav toggle
- `style.css` — responsive styles, layout, and dark-mode
- `app.js` — dynamic loading, interactions, and theme persistence
- `images.json` — image manifest (auto-generated)
- `scripts/generate-manifest.js` — Node script to regenerate `images.json`

Accessibility
- Thumbnails are focusable and actionable via keyboard (Enter/Space).
- `aria-live` regions and sensible alt text are used to help screen-reader users.

Questions or next steps
- Want a generator to create optimized `srcset`/WebP images?
- Want the site deployed (GitHub Pages) and a CI step to regenerate the manifest automatically? 

---
Made for quick edits and scalable galleries. If you'd like, I can add automated image optimization and `srcset` generation next.
