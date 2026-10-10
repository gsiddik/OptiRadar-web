"""Builds the web app logo and icons from the OptiRadar brand sources in this folder.

Usage: python3 branding/generate.py   (needs Pillow and NumPy)

The sources are flat images on a white background. The white is turned into transparency, the artwork is
cropped to its content, and every icon size the app and the PWA manifest use is rendered from it.
"""
import base64
import io
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PUBLIC = ROOT / 'public'
IMAGES = ROOT / 'src' / 'resources' / 'images'
WHITE = (255, 255, 255, 255)


def transparent(path):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    darkest = rgb.min(axis=2)
    ink, noise = 12.0, 6.0
    alpha = np.clip((255 - darkest - noise) / (255 - ink - noise), 0, 1)
    safe = np.where(alpha > 0, alpha, 1)[..., None]
    color = np.clip((rgb - (1 - alpha[..., None]) * 255) / safe, 0, 255)
    image = Image.fromarray(np.dstack([color, alpha * 255]).round().astype(np.uint8), 'RGBA')
    return image.crop(image.getbbox())


def centered(image, fill, background=(0, 0, 0, 0)):
    """Square canvas where the artwork takes `fill` of the side."""
    side = int(max(image.size) / fill)
    canvas = Image.new('RGBA', (side, side), background)
    canvas.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
    return canvas


def tile(emblem, size, fill, radius=0.22):
    """Emblem on a white rounded square, readable on light and dark launchers and browser tabs."""
    big = size * 4
    canvas = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * radius), fill=WHITE)
    canvas.alpha_composite(centered(emblem, fill).resize((big, big), Image.LANCZOS))
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    logo = transparent(HERE / 'optiradar-logo.png')
    width = 1200
    logo = logo.resize((width, round(logo.height * width / logo.width)), Image.LANCZOS)
    logo.save(IMAGES / 'logo.png', optimize=True)
    inverted = np.asarray(logo).copy()
    inverted[inverted[..., 2] < 180, 0:3] = 255  # navy parts become white, the blue accent stays
    Image.fromarray(inverted, 'RGBA').save(IMAGES / 'logo-inverted.png', optimize=True)

    emblem = transparent(HERE / 'optiradar-emblem.png')
    for size in (64, 192, 512):
        tile(emblem, size, 0.80).save(PUBLIC / f'pwa-{size}x{size}.png', optimize=True)
    centered(emblem, 0.72, WHITE).resize((512, 512), Image.LANCZOS).convert('RGB').save(
        PUBLIC / 'maskable-icon-512x512.png', optimize=True)
    centered(emblem, 0.82, WHITE).resize((180, 180), Image.LANCZOS).convert('RGB').save(
        PUBLIC / 'apple-touch-icon-180x180.png', optimize=True)
    tile(emblem, 256, 0.86).save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (256, 256)])

    buffer = io.BytesIO()
    tile(emblem, 128, 0.80).save(buffer, 'PNG', optimize=True)
    data = base64.b64encode(buffer.getvalue()).decode()
    (PUBLIC / 'logo.svg').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg width="64" height="64" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink">\n <title>OptiRadar</title>\n'
        f' <image width="64" height="64" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{data}"/>\n'
        '</svg>\n')


if __name__ == '__main__':
    main()
