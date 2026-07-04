"""Generate Lexicon Master PWA icons (no external assets required).

Draws a vertical accent gradient background with a bold "Lx" wordmark.
Produces full-bleed `any` icons and a `maskable` variant whose content sits
inside the central safe zone.

Run: python3 scripts/gen_icons.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

TOP = (124, 92, 255)  # --accent  #7c5cff
BOTTOM = (99, 210, 255)  # #63d2ff
TEXT = (255, 255, 255)


def gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = round(TOP[0] + (BOTTOM[0] - TOP[0]) * t)
        g = round(TOP[1] + (BOTTOM[1] - TOP[1]) * t)
        b = round(TOP[2] + (BOTTOM[2] - TOP[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def draw_mark(img: Image.Image, safe_ratio: float) -> None:
    size = img.width
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(size * 0.5 * safe_ratio))
    text = "Lx"
    box = draw.textbbox((0, 0), text, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(
        ((size - w) / 2 - box[0], (size - h) / 2 - box[1]),
        text,
        font=font,
        fill=TEXT,
    )


def make(name: str, size: int, safe_ratio: float = 1.0) -> None:
    img = gradient(size)
    draw_mark(img, safe_ratio)
    img.save(OUT / name)
    print("wrote", OUT / name)


if __name__ == "__main__":
    make("pwa-192.png", 192)
    make("pwa-512.png", 512)
    # Maskable: keep the wordmark within the central ~80% safe zone.
    make("pwa-maskable-512.png", 512, safe_ratio=0.8)
