#!/usr/bin/env python3
"""Generates the favicon set from the wordmark's own letterform.

The identity is "Built *at* Albert", where the italic vermilion "at" is the only
distinctive part. The mark is an italic A in Instrument Serif, cream on
vermilion, full bleed: it keeps that slant and still resolves at 16 pixels,
which the lowercase italic a does not — its bowl and stem merge into a smudge.

Pillow rather than sharp: sharp would have to render the glyph through librsvg,
which resolves fonts from the host system and quietly substitutes a different
face when it cannot find one. Reading the .ttf directly is deterministic.

    python3 scripts/generate-favicon.py
"""

import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT = ROOT / "assets" / "fonts" / "InstrumentSerif-Italic.ttf"
OUT = ROOT / "public"

VERMILION = (226, 72, 60, 255)
PAPER = (244, 241, 234, 255)
GLYPH = "A"

# Rendered large and downsampled, so the serifs survive at 16 pixels.
MASTER = 1024


def render(size: int) -> Image.Image:
    image = Image.new("RGBA", (MASTER, MASTER), VERMILION)
    draw = ImageDraw.Draw(image)

    # Sized so the ink clears the edges once the italic's lean is accounted for;
    # verify_fit() below fails the build if it ever stops clearing them.
    font = ImageFont.truetype(str(FONT), int(MASTER * 0.74))

    # Centre on the glyph's ink, not on its em box. An italic sits well off
    # centre otherwise, and the lowercase a has no ascender to balance it.
    left, top, right, bottom = draw.textbbox((0, 0), GLYPH, font=font)
    x = (MASTER - (right - left)) / 2 - left
    y = (MASTER - (bottom - top)) / 2 - top

    draw.text((x, y), GLYPH, font=font, fill=PAPER)
    verify_fit(image)
    return image.resize((size, size), Image.LANCZOS)


def verify_fit(image: Image.Image) -> None:
    """Refuses to write a mark whose letterform touches the tile edge.

    An italic leans, so a size ratio that looks safe upright can clip the apex
    on one side and go unnoticed until it is live in a browser tab.
    """
    pixels = image.load()
    width, height = image.size
    margin = int(width * 0.04)

    edges = [(x, y) for x in range(width) for y in range(margin)]
    edges += [(x, y) for x in range(width) for y in range(height - margin, height)]
    edges += [(x, y) for y in range(height) for x in range(margin)]
    edges += [(x, y) for y in range(height) for x in range(width - margin, width)]

    if any(pixels[x, y][:3] != VERMILION[:3] for x, y in edges):
        raise SystemExit("The letterform runs off the tile; lower the size ratio.")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for size, name in [
        (16, "favicon-16x16.png"),
        (32, "favicon-32x32.png"),
        (48, "favicon-48x48.png"),
        (180, "apple-touch-icon.png"),
        (192, "android-chrome-192x192.png"),
        (512, "android-chrome-512x512.png"),
    ]:
        render(size).save(OUT / name)
        print(f"  {name}")

    # A multi-size .ico so Windows and older browsers pick the sharpest tile.
    render(256).save(
        OUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )
    print("  favicon.ico")

    manifest = {
        "name": "Built at Albert",
        "short_name": "Built at Albert",
        "icons": [
            {"src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "theme_color": "#e2483c",
        "background_color": "#f4f1ea",
        "display": "standalone",
        "start_url": "/ideas/",
    }
    (OUT / "site.webmanifest").write_text(json.dumps(manifest, indent=2) + "\n")
    print("  site.webmanifest")


if __name__ == "__main__":
    main()
