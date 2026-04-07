# Project Instructions

## Export

After every change to the presentation (slides, CSS, JS, etc.), always re-export using:

```bash
python3 export.py --minify --strip-notes
```

This ensures `dist/index.html` stays up to date with the latest changes, minified and with speaker notes stripped.
