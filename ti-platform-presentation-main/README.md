# Censia AI — Talent Intelligence Platform Presentation

HTML slide deck. Open `index.html` in a browser (requires a local server for slide loading via `fetch`), or export a single self-contained file for distribution.

## Navigation

- **Arrow keys** / **Space** — next/previous slide
- **N** — toggle speaker notes

## Exporting

`export.py` bundles everything into a single HTML file that works offline (just double-click to open).

```bash
# Basic export — all slides, CSS, JS inlined (outputs to dist/index.html)
python3 export.py

# Custom output path
python3 export.py -o deck.html

# Minified — smaller file, JS variable mangling via terser (falls back to
# basic whitespace/comment stripping if Node.js/terser isn't available)
python3 export.py --minify

# Strip speaker notes — removes all notes from the exported file
python3 export.py --strip-notes

# Distribution build — minified, no notes
python3 export.py --minify --strip-notes
```

### Requirements

- **Python 3.10+** (no pip dependencies)
- **Node.js + npx** (optional) — enables terser for proper JS minification with variable mangling. Without it, a basic regex-based minifier is used instead.

### What the export does

1. Inlines `css/styles.css` into a `<style>` tag
2. Inlines `js/animations.js`, `js/graph.js`, `js/main.js` into `<script>` tags
3. Embeds all slide HTML files into a JS object with a `fetch()` shim so `main.js` works unmodified
4. Converts local images to data URIs
5. External CDN resources (Google Fonts, GSAP, 3D Force Graph) still require internet

## Development

```
├── index.html              # Dev entry point (needs local server)
├── export.py               # Single-file export script
├── css/styles.css          # All styles
├── js/
│   ├── animations.js       # GSAP slide animations
│   ├── graph.js            # 3D force graph (convergence + drift)
│   └── main.js             # Slide loader, navigation, orchestration
├── slides/                 # Individual slide HTML files
└── dist/                   # Exported builds
```

Slide order is controlled by the `SLIDE_FILES` array in `js/main.js`.
