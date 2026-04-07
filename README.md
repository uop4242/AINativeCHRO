# Censia AI-Native CHRO Initiative — Web

Marketing and advisory board site for the Censia AI-Native CHRO program. A set of static HTML pages deployed via GitHub Pages (or any static host).

---

## Pages

| File | URL path | Description |
|------|----------|-------------|
| `index.html` | `/` | Home — advisory board pitch, program overview |
| `ai-native-chro-solution.html` | `/ai-native-chro-solution` | Explore the Platform — full solution overview |
| `employee-intelligence-deck.html` | `/employee-intelligence-deck` | Employee Intelligence — EPE/JPE module deep-dive |
| `ti-platform-presentation-main/dist/index.html` | `/ti-platform-presentation-main/dist/` | AI Data Foundation — interactive slide presentation |
| `epe-example.html` | `/epe-example` | EPE demo page (standalone, not in main nav) |
| `jpe-example.html` | `/jpe-example` | JPE demo page (standalone, not in main nav) |

---

## Project Structure

```
/
├── index.html                          # Home page
├── ai-native-chro-solution.html        # Platform overview
├── employee-intelligence-deck.html     # Employee intelligence deck
├── epe-example.html                    # EPE demo (standalone)
├── jpe-example.html                    # JPE demo (standalone)
├── favicon.svg                         # Site favicon (SVG, Censia mark)
├── robots.txt
├── .gitignore
│
├── css/
│   ├── global.css          ← SHARED: design tokens, nav, reset — loaded by every page
│   ├── index.css           ← Page-specific: Home
│   ├── ai-solution.css     ← Page-specific: Platform overview
│   └── employee-deck.css   ← Page-specific: Employee intelligence
│
├── assets/
│   └── images/
│       └── hero-people.png
│
└── ti-platform-presentation-main/      # AI Data Foundation presentation
    ├── index.html                      # Dev entry point (requires local server)
    ├── export.py                       # Build script → produces dist/index.html
    ├── censia-logo.svg
    ├── css/
    │   └── styles.css                  # Presentation-specific styles
    ├── js/
    │   ├── animations.js               # GSAP slide animations
    │   ├── graph.js                    # 3D force graph
    │   └── main.js                     # Slide loader, nav, orchestration
    ├── slides/                         # Individual slide HTML files (00–22)
    └── dist/
        └── index.html                  # ← BUILT FILE — commit this, it's the live page
```

---

## CSS Architecture

### How styles are organized

Every page loads **two** CSS files:

```html
<link rel="stylesheet" href="css/global.css"/>   <!-- shared tokens + nav -->
<link rel="stylesheet" href="css/[page].css"/>   <!-- page-specific styles -->
```

### global.css — single source of truth

`css/global.css` owns all canonical design tokens. **Never hardcode color hex values in page CSS** — always use a variable from global.css.

Key tokens:

```css
--censia-teal:      #00B6A1   /* primary brand teal */
--censia-teal-deep: #008573
--censia-gold:      #D4A843
--censia-coral:     #FF6B5A
--bg-dark:          #0A2B2A   /* primary dark background */
--bg-darkest:       #001a17
--nav-height:       70px      /* used by all pages for layout offset */
--font-heading:     'Space Grotesk', sans-serif
--font-body:        'Inter', sans-serif
```

### Layout offset rule

The global nav is `position: fixed; height: var(--nav-height)` (70px). Every page's main content container must account for this:

```css
/* Slide-based pages (index.html, ti-platform) */
#deck    { position: fixed; top: 70px; ... }
.presentation { position: fixed; top: 70px; ... }

/* Rail-based pages (employee-intelligence-deck.html) */
#rail    { margin-top: 70px; height: calc(100vh - 70px); }

/* Scrolling pages (ai-native-chro-solution.html) */
.section { padding-top: 80px; }   /* intentionally 10px above nav */
```

---

## Navigation

All pages share the same global nav. The nav HTML block lives in each HTML file's `<body>` (not a server-side include — this is a static site). When adding or renaming nav items, update the nav block in **all** pages:

- `index.html`
- `ai-native-chro-solution.html`
- `employee-intelligence-deck.html`
- `ti-platform-presentation-main/index.html`

Active state: add `class="global-nav-link active"` and `aria-current="page"` to the link that matches the current page.

---

## Running Locally

Most pages are plain HTML and open directly in a browser. The one exception is the **AI Data Foundation presentation** dev build, which uses `fetch()` to load individual slide files and requires a local server:

```bash
# From the ti-platform-presentation-main/ directory:
python3 -m http.server 8000
# Then open: http://localhost:8000
```

For all other pages, just double-click the HTML file or open it with `File → Open` in your browser.

---

## Editing the AI Data Foundation Presentation

The presentation is maintained as individual slide files for easy editing.

**1. Edit slides** — each slide is a standalone HTML file in `slides/`:
```
slides/00-title.html
slides/01-intro.html
slides/21-verizon-case-study.html
... (23 total)
```

**2. Reorder slides** — edit the `SLIDE_FILES` array at the top of `js/main.js`.

**3. Build for distribution** — run the export script from inside `ti-platform-presentation-main/`:
```bash
python3 export.py --minify --strip-notes
# Output: dist/index.html  (self-contained, works offline)
```

**Always re-run the export after editing slides, CSS, or JS.** The `dist/index.html` is what the nav links to and what gets served live.

---

## Deploying to GitHub Pages

1. Push to `main` (or your target branch)
2. In GitHub repo Settings → Pages → Source: select `main` branch, root `/`
3. The site will be live at `https://[org].github.io/[repo]/`

**Note:** The ti-platform presentation uses two external CDN dependencies that require internet access even in the offline-exported build:
- GSAP animation library (`cdnjs.cloudflare.com`)
- 3D Force Graph (`unpkg.com`)
- Google Fonts

These are loaded at runtime and cannot be bundled — ensure your deployment environment has outbound internet access.

---

## Adding a New Page

1. Copy the closest existing page as a template
2. Update the `<title>`, `<meta name="description">`, and OG/Twitter tags
3. Link `css/global.css` and a new `css/[your-page].css`
4. Add the global nav block (copy from any existing page), set the correct link as `active`
5. Ensure your main content container accounts for the 70px nav (see Layout offset rule above)
6. Add a `<link rel="icon" href="favicon.svg" type="image/svg+xml"/>` tag
7. Add the new page to the nav on all other pages

---

## Manual Cleanup Needed

- **Delete `/js/` directory** — it exists at the root but is empty. It cannot be removed via the editor; delete it manually from your file system or via `git rm -r js/`.
- **`epe-example.html` and `jpe-example.html`** — standalone demo pages not integrated into the main nav. Decide if these should be integrated, redirected, or removed.

---

## Tech Stack

- Pure HTML, CSS, JavaScript — no framework, no build step for main site pages
- Google Fonts (Space Grotesk, Inter) — loaded via CDN
- GSAP 3 — animation library for the ti-platform presentation
- 3D Force Graph — WebGL graph for the ti-platform presentation
- Python 3 — used only for `ti-platform-presentation-main/export.py` build script
