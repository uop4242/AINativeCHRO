#!/usr/bin/env python3
"""
Export the presentation as a single self-contained HTML file.

Usage:
    python export.py                  # outputs to dist/presentation.html
    python export.py -o my-deck.html  # custom output path

The exported file works offline (just double-click to open) — all slides,
CSS, and JS are inlined. Only external CDN scripts (GSAP, 3D Force Graph,
Google Fonts) still require an internet connection.
"""

import argparse
import base64
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def read(rel_path: str) -> str:
    return (SCRIPT_DIR / rel_path).read_text(encoding="utf-8")


def minify_css(css: str) -> str:
    """Basic CSS minification — removes comments, extra whitespace, and newlines."""
    # Remove block comments
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    # Remove line breaks and collapse whitespace
    css = re.sub(r"\s+", " ", css)
    # Remove spaces around punctuation
    css = re.sub(r"\s*([{}:;,>~+])\s*", r"\1", css)
    # Remove trailing semicolons before closing braces
    css = css.replace(";}", "}")
    return css.strip()


def _terser_available() -> bool:
    """Check if terser is available via npx."""
    return shutil.which("npx") is not None


def _minify_js_terser(js: str) -> str:
    """Minify JS using terser — proper mangling of local variables."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False) as f:
        f.write(js)
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["npx", "terser", tmp_path, "--compress", "--mangle"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout
        # Fall through to basic minification on failure
        print(f"  terser warning: {result.stderr.strip()}", file=sys.stderr)
        return None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None
    finally:
        os.unlink(tmp_path)


def _minify_js_basic(js: str) -> str:
    """Basic JS minification — removes comments and collapses whitespace."""
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.DOTALL)
    js = re.sub(r"(?m)^\s*//.*$", "", js)
    js = re.sub(r"\s+//\s.*$", "", js, flags=re.MULTILINE)
    js = re.sub(r"\n{3,}", "\n", js)
    js = re.sub(r"(?m)^[ \t]+", "", js)
    js = re.sub(r"\n{2,}", "\n", js)
    return js.strip()


def minify_js(js: str) -> str:
    """Minify JS — uses terser if available, falls back to basic."""
    if _terser_available():
        result = _minify_js_terser(js)
        if result is not None:
            return result
        print("  Falling back to basic JS minification", file=sys.stderr)
    return _minify_js_basic(js)


def strip_speaker_notes(html: str) -> str:
    """Remove speaker notes from slide HTML for distribution builds."""
    return re.sub(
        r'<div class="speaker-notes".*?</div>\s*',
        "",
        html,
        flags=re.DOTALL,
    )


def read_bytes(rel_path: str) -> bytes:
    return (SCRIPT_DIR / rel_path).read_bytes()


def to_data_uri(file_path: Path) -> str:
    """Convert a local file to a data: URI."""
    data = file_path.read_bytes()
    mime, _ = mimetypes.guess_type(file_path.name)
    if mime is None:
        mime = "application/octet-stream"
    # SVGs are small enough to inline as text for cleaner output
    if mime == "image/svg+xml":
        svg_text = data.decode("utf-8")
        encoded = urllib.parse.quote(svg_text, safe="")
        return f"data:{mime},{encoded}"
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{b64}"


def inline_local_assets(html: str) -> str:
    """Replace local src="..." and url(...) references with data: URIs."""
    def replace_img_src(match):
        prefix = match.group(1)
        src = match.group(2)
        # Skip external URLs and data URIs
        if src.startswith(("http://", "https://", "data:", "//")):
            return match.group(0)
        asset_path = SCRIPT_DIR / src
        if asset_path.exists():
            return f'{prefix}"{to_data_uri(asset_path)}"'
        return match.group(0)

    # Match src="..." in img tags (and similar)
    html = re.sub(r'(<img[^>]*\ssrc=)"([^"]+)"', replace_img_src, html)
    return html


def extract_slide_paths(main_js: str) -> list[str]:
    """Parse the SLIDE_FILES array from main.js."""
    match = re.search(r"const SLIDE_FILES\s*=\s*\[(.*?)\];", main_js, re.DOTALL)
    if not match:
        sys.exit("ERROR: Could not find SLIDE_FILES array in js/main.js")
    return re.findall(r"'([^']+)'", match.group(1))


def build_fetch_shim(slide_map: dict[str, str]) -> str:
    """
    Generate a <script> block that overrides fetch() for local slide paths.
    This lets main.js's loadSlides() work unmodified — it calls fetch() and
    gets the embedded HTML back as a Response.
    """
    encoded = json.dumps(slide_map, ensure_ascii=False)
    return f"""\
<script>
// ── Embedded slide data (injected by export.py) ──────────
const __EMBEDDED_SLIDES__ = {encoded};

const __originalFetch__ = window.fetch.bind(window);
window.fetch = function(url) {{
    if (__EMBEDDED_SLIDES__[url] !== undefined) {{
        return Promise.resolve(new Response(__EMBEDDED_SLIDES__[url], {{
            status: 200,
            headers: {{ 'Content-Type': 'text/html' }}
        }}));
    }}
    return __originalFetch__(url);
}};
</script>"""


def export(output_path: Path, *, minify: bool = False, strip_notes: bool = False) -> None:
    # ── Read source files ──────────────────────────────────
    global_css = read("../css/global.css")
    css = read("css/styles.css")
    animations_js = read("js/animations.js")
    graph_js = read("js/graph.js")
    main_js = read("js/main.js")

    # ── Extract slide paths BEFORE minification (regex needs original names) ──
    slide_paths = extract_slide_paths(main_js)

    # ── Minify if requested ────────────────────────────────
    if minify:
        global_css = minify_css(global_css)
        css = minify_css(css)
        animations_js = minify_js(animations_js)
        graph_js = minify_js(graph_js)
        main_js = minify_js(main_js)
    slide_map = {}
    for rel in slide_paths:
        try:
            slide_html = read(rel)
            slide_html = inline_local_assets(slide_html)
            if strip_notes:
                slide_html = strip_speaker_notes(slide_html)
            slide_map[rel] = slide_html
        except FileNotFoundError:
            sys.exit(f"ERROR: Slide file not found: {rel}")

    # ── Build the single HTML file ─────────────────────────
    fetch_shim = build_fetch_shim(slide_map)

    # Censia logo SVG (inline, used in global nav)
    censia_logo_svg = """\
<svg id="global-Color" viewbox="0 0 797.85 180.56" xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1{fill:#fff}.cls-2{fill:#37cac1}.cls-3{fill:#057d72}</style></defs><g><path class="cls-2" d="M101.16,54.83s-25.83,23.63-38.75,35.44l38.7,35.41-44.2,40.48S27.72,115.58,13.13,90.29C27.73,64.99,56.93,14.4,56.93,14.4l44.24,40.44Z"></path><path class="cls-3" d="M57.67,167.43l84.35-77.15L57.67,13.13h89.09l44.55,77.15-44.55,77.15H57.67Z"></path></g><g><path class="cls-1" d="M306.04,109.19c-.98,9.43-4.33,17.02-10,22.82-8.05,8.25-18.02,12.37-29.88,12.37s-21.83-3.88-29.58-11.63c-5.21-5.19-8.67-11.12-10.37-17.74-1.72-6.62-2.57-14.84-2.57-24.65s.85-18.03,2.57-24.65c1.72-6.62,5.18-12.54,10.37-17.74,7.84-7.85,17.71-11.77,29.58-11.77s22.03,4.03,29.88,12.08c5.69,5.8,9.02,13.35,10,22.67h-19.43c-.39-4.03-1.97-7.71-4.71-11.04-3.44-4.31-8.68-6.48-15.75-6.48-6.37,0-11.74,2.31-16.05,6.92-2.26,2.36-3.95,5.49-5.09,9.41-1.13,3.92-1.77,7.21-1.91,9.86-.15,2.65-.22,6.23-.22,10.75s.08,8.09.22,10.74c.14,2.65.79,5.94,1.91,9.86,1.13,3.92,2.82,7.07,5.09,9.41,4.31,4.62,9.66,6.92,16.05,6.92,6.96,0,12.22-2.22,15.75-6.62,2.74-3.33,4.31-7.16,4.71-11.49h19.43Z"></path><path class="cls-1" d="M381.26,104.77c-.09,2.36-.14,4.08-.14,5.15h-51.23c-.2,6.28,1.67,11.29,5.6,15.01,3.33,3.15,7.12,4.71,11.33,4.71,5.01,0,8.73-1.23,11.19-3.67,1.77-1.77,2.99-3.92,3.67-6.48h17.66c-.5,4.81-2.65,9.52-6.48,14.13-6.09,7.16-14.67,10.74-25.75,10.74-9.52,0-17.57-3.13-24.14-9.43-7.85-7.55-11.77-17.77-11.77-30.62s3.67-23.06,11.04-30.62c6.28-6.48,14.42-9.72,24.44-9.72,12.37,0,21.69,4.71,27.97,14.13,4.71,7.16,6.92,16.05,6.62,26.64l-.02.05ZM362.85,96.53c-.09-5.6-1.67-10.06-4.71-13.4-2.74-2.95-6.62-4.42-11.63-4.42-5.6,0-9.86,1.97-12.81,5.89-2.56,3.24-3.88,7.21-3.97,11.92h33.12Z"></path><path class="cls-1" d="M454.86,142.47h-18.4v-46.96c0-4.81-.96-8.42-2.87-10.82-1.91-2.4-5.18-3.6-9.78-3.6-5.89,0-10.3,3.24-13.24,9.72-1.67,3.83-2.5,10.65-2.5,20.47v31.21h-18.4v-76.55h15.46l1.33,9.86c2.16-3.83,5.27-6.74,9.35-8.76,4.06-2.02,8.47-3.02,13.18-3.02,8.05,0,14.37,2.53,18.99,7.58,4.6,5.05,6.92,11.66,6.92,19.8v51.07h-.03Z"></path><path class="cls-1" d="M528.01,118.76c0,6.78-2.2,12.36-6.62,16.78-5.89,5.89-14.62,8.84-26.2,8.84-10.3,0-18.54-2.95-24.73-8.84-5.4-5.19-8.09-11.13-8.09-17.82h17.23c0,3.74,1.38,6.71,4.12,8.98,2.84,2.26,6.71,3.38,11.63,3.38,10.4,0,15.6-3.24,15.6-9.72,0-4.6-2.56-7.3-7.66-8.09-1.18-.2-4.34-.59-9.49-1.18-5.15-.59-9.05-1.18-11.71-1.77-5.19-1.09-9.41-3.53-12.65-7.36-3.24-3.83-4.85-8.19-4.85-13.1,0-6.96,2.59-12.71,7.8-17.23,5.89-5.1,13.64-7.66,23.26-7.66,10.4,0,18.4,2.99,23.99,8.98,4.51,4.81,6.78,10.06,6.78,15.75h-17.52c0-2.56-1.02-4.96-3.09-7.21-2.36-2.36-5.69-3.54-10.02-3.54-3.44,0-6.08.39-7.94,1.18-3.92,1.57-5.89,4.26-5.89,8.09,0,4.22,2.95,6.78,8.84,7.66,8.14,1.09,13.58,1.81,16.34,2.2,6.28.98,11.33,3.36,15.16,7.15,3.83,3.78,5.74,8.61,5.74,14.5l-.02.03Z"></path><path class="cls-1" d="M555.83,55.31h-19.72v-18.99h19.72v18.99ZM555.39,142.47h-18.7v-76.55h18.7v76.55Z"></path><path class="cls-1" d="M635.62,141.57c-3.24,1.36-6.28,2.06-9.14,2.06-3.83,0-6.87-1.02-9.13-3.09-2.27-2.06-3.53-4.6-3.83-7.66-1.86,3.24-4.92,5.95-9.13,8.17-4.22,2.22-8.93,3.32-14.13,3.32-8.73,0-15.54-2.33-20.39-6.99-4.86-4.65-7.29-10.33-7.29-17.01,0-7.07,2.43-12.71,7.29-16.93,4.85-4.22,11.07-6.57,18.62-7.07l22.53-1.61v-4.71c0-3.92-.93-6.91-2.79-8.98-1.86-2.06-5.26-3.09-10.15-3.09-8.84,0-13.49,3.63-13.99,10.88h-17.81c.49-8.25,3.66-14.45,9.49-18.62,5.83-4.17,13.27-6.26,22.3-6.26,15.12,0,24.68,5.21,28.7,15.6,1.47,3.74,2.2,8.88,2.2,15.46v28.4c0,1.77.32,3.02.96,3.75.64.74,1.74,1.1,3.32,1.1l2.36-.29v13.54l.02.03ZM611.04,111.98v-3.53l-19.43,1.47c-3.04.2-5.64,1.18-7.8,2.95-2.15,1.77-3.24,4.12-3.24,7.07s1.07,5.15,3.24,6.91c2.16,1.77,4.71,2.65,7.66,2.65,5.9,0,10.62-1.55,14.21-4.64,3.58-3.1,5.38-7.38,5.38-12.88h-.02Z"></path></g><g><path class="cls-1" d="M726.66,120.72h-38.4l-7.3,21.9h-23.29l39.57-106.3h20.3l39.79,106.3h-23.29l-7.37-21.9ZM694.17,102.98h26.58l-13.36-39.79-13.21,39.79Z"></path><path class="cls-1" d="M784.72,36.48v106.15h-18.7V36.48h18.7Z"></path></g></svg>"""

    html = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Censia AI &#x2014; Talent Intelligence Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><CLOSE_SCRIPT>
    <script src="https://unpkg.com/3d-force-graph"><CLOSE_SCRIPT>
    <style>
{global_css}
{css}
/* ── Nav offset: push presentation below the 70px global header ── */
.presentation {{
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    bottom: 0;
    height: auto;
}}
    </style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>

<!-- ── GLOBAL NAV ── -->
<div class="global-header-bar">
<div class="global-header-inner">
<a class="global-logo" href="../../index.html">
{censia_logo_svg}
</a>
<div class="global-nav-links">
<a class="global-nav-link" href="../../index.html">Home</a>
<a class="global-nav-link" href="../../ai-native-chro-solution.html">Explore the Platform</a>
<a class="global-nav-link" href="../../employee-intelligence-deck.html">Employee Intelligence</a>
<a class="global-nav-link active" href="#" aria-current="page">AI Data Foundation</a>
</div>
</div>
</div>

<div id="main-content" class="presentation">
    <!-- Slides are embedded inline via fetch shim -->
</div>

    <!-- Navigation dots -->
    <div class="nav-dots" id="navDots"></div>

    <!-- Mobile navigation buttons -->
    <div class="mobile-nav">
        <button class="mobile-nav-btn mobile-nav-prev" id="mobilePrev" aria-label="Previous slide">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
        </button>
        <span class="mobile-nav-counter" id="mobileCounter">0 / 0</span>
        <button class="mobile-nav-btn mobile-nav-next" id="mobileNext" aria-label="Next slide">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
        </button>
    </div>

    <!-- Fetch shim: serves embedded slide HTML to loadSlides() -->
    {fetch_shim}

    <!-- JS modules: order matters — animations & graph before main -->
    <script>
{animations_js}
    <CLOSE_SCRIPT>
    <script>
{graph_js}
    <CLOSE_SCRIPT>
    <script>
{main_js}
    <CLOSE_SCRIPT>
</body>
</html>"""

    # Restore closing script tags (placeholder avoids f-string escape issues)
    html = html.replace("<CLOSE_SCRIPT>", "</script>")

    # ── Write output ───────────────────────────────────────
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")

    size_kb = output_path.stat().st_size / 1024
    flags = []
    if minify:
        flags.append("minified")
    if strip_notes:
        flags.append("notes stripped")
    flag_str = f" [{', '.join(flags)}]" if flags else ""
    print(f"Exported to {output_path} ({size_kb:.0f} KB){flag_str}")
    print(f"  {len(slide_paths)} slides inlined")
    print(f"  Open in any browser — no server needed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export presentation as a single HTML file")
    parser.add_argument(
        "-o", "--output",
        default="dist/index.html",
        help="Output file path (default: dist/index.html)",
    )
    parser.add_argument(
        "--minify",
        action="store_true",
        help="Minify CSS and JS for smaller output and light obfuscation",
    )
    parser.add_argument(
        "--strip-notes",
        action="store_true",
        help="Remove speaker notes from the exported file",
    )
    args = parser.parse_args()
    export(Path(args.output), minify=args.minify, strip_notes=args.strip_notes)
