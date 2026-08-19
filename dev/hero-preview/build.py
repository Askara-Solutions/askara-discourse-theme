#!/usr/bin/env python3
"""Build the self-contained hero preview (BDEV-282).

The homepage hero renders live only on the deployed Discourse site, so this tool produces a
faithful, self-contained HTML replica for local review and for the claude.ai Artifact used to
approve scrim/typography changes. It inlines the brand font and the four bundled hero images as
data URIs (Artifacts run under a strict CSP that blocks external hosts), so the output has no
external dependencies.

Usage (from anywhere):
    python3 dev/hero-preview/build.py
    # -> writes dev/hero-preview/hero-preview.built.html  (gitignored; open in a browser or publish)

The template `hero-preview.html` carries placeholders (__PJS__, __IMG1__..__IMG4__) that this
script replaces with data URIs read from the real theme assets. Edit the template to enhance the
preview; the built file is regenerated, never hand-edited. See README.md for the full workflow.
"""

import base64
import pathlib
import sys

SCRIPT_DIR = pathlib.Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent  # dev/hero-preview -> dev -> repo root

# placeholder -> (repo-relative asset path, mime type)
ASSETS = {
    "__PJS__": ("assets/plus-jakarta-sans.woff2", "font/woff2"),
    "__IMG1__": ("assets/hero/hero_bg_img_1_assembly.webp", "image/webp"),
    "__IMG2__": ("assets/hero/hero_bg_img_2_exhibition_hall.webp", "image/webp"),
    "__IMG3__": ("assets/hero/hero_bg_img_3_reflecting_pool.webp", "image/webp"),
    "__IMG4__": ("assets/hero/hero_bg_img_4_colonnade.webp", "image/webp"),
}


def data_uri(rel_path: str, mime: str) -> str:
    raw = (REPO_ROOT / rel_path).read_bytes()
    return f"data:{mime};base64,{base64.b64encode(raw).decode()}"


def main() -> int:
    template = SCRIPT_DIR / "hero-preview.html"
    html = template.read_text()
    for placeholder, (rel_path, mime) in ASSETS.items():
        if placeholder not in html:
            print(f"warning: {placeholder} not found in template", file=sys.stderr)
        html = html.replace(placeholder, data_uri(rel_path, mime))
    out = SCRIPT_DIR / "hero-preview.built.html"
    out.write_text(html)
    print(f"built {out.relative_to(REPO_ROOT)} ({out.stat().st_size / 1048576:.2f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
