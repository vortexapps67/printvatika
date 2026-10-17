"""Print Vatika brand assets, all derived from logo.png.

    python scripts/make-brand-assets.py

Source: logo.png, a 1254x1254 RGB lockup on white, in five stacked bands:
    y 140-666    the mark (P plus CMYK pixel squares)
    y 697-848    the wordmark "Print Vatika"
    y 885-917    the tagline "WE PRINT, YOU IMPRESS"
    y 953-1046   the product icons
    y 1064-1079  the product labels

Outputs
    public/images/logo-mark.png     192px square, white: navbar/footer/admin tile
    public/images/logo-lockup.webp  520px wide: mark + wordmark + tagline, for cards
    src/app/icon.png                favicon, outer white keyed out
    src/app/apple-icon.png          touch icon
    public/og.png                   1200x630 social card

The favicon keeps its interior whites: the background is removed by flood-filling
inward from the borders only, so the page inside the P stays white instead of
going hollow when the icon sits on dark browser chrome.

Replaces scripts/make-og.ps1, which drew the card in the retired Archivo / IBM
Plex faces with the old magenta identity, and shipped mojibake (its middot, dash,
rupee and ellipsis had been written to disk through the wrong codepage).
"""

from collections import deque
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'logo.png')
IMAGES = os.path.join(ROOT, 'public', 'images')
APP = os.path.join(ROOT, 'src', 'app')
FONT_DIR = os.environ.get('FONT_DIR', r'C:\Windows\Fonts')

MARK = (219, 140, 984, 667)
LOCKUP = (129, 140, 1130, 918)          # mark + wordmark + tagline
WHITE = (255, 255, 255)

# Design tokens, mirroring tailwind.config.js.
INK_950 = (11, 11, 12)
INK_500 = (99, 103, 111)
INK_200 = (211, 213, 217)
TURQUOISE = (11, 124, 138)
PRESS_CYAN = (0, 163, 224)
PRESS_YELLOW = (255, 184, 28)


def trim(img):
    """Crop to the artwork, ignoring the near-white surround."""
    return img.crop(img.convert('L').point(lambda v: 255 if v < 245 else 0).getbbox())


def pad(img, margin, fill=WHITE):
    w, h = img.size
    out = Image.new('RGB', (int(w * (1 + margin * 2)), int(h * (1 + margin * 2))), fill)
    out.paste(img, ((out.size[0] - w) // 2, (out.size[1] - h) // 2))
    return out


def pad_square(img, margin=0.07, fill=WHITE):
    w, h = img.size
    side = int(max(w, h) * (1 + margin * 2))
    out = Image.new('RGB', (side, side), fill)
    out.paste(img, ((side - w) // 2, (side - h) // 2))
    return out


def fit(img, width):
    ratio = width / img.size[0]
    return img.resize((width, max(1, round(img.size[1] * ratio))), Image.LANCZOS)


def save_png(img, path, colours=64, dither=Image.Dither.NONE):
    img.quantize(colors=colours, method=Image.MEDIANCUT, dither=dither).convert('RGB').save(
        path, optimize=True
    )
    print('  %-42s %sx%s  %.1f KB' % (os.path.relpath(path, ROOT), img.size[0], img.size[1], os.path.getsize(path) / 1024))


def save_rgba_png(img, path, colours=64):
    """Quantise a transparent image, keeping the alpha channel in the palette."""
    img.quantize(colors=colours, method=Image.FASTOCTREE).save(path, optimize=True)
    print('  %-42s %sx%s  %.1f KB' % (os.path.relpath(path, ROOT), img.size[0], img.size[1], os.path.getsize(path) / 1024))


def save_webp(img, path, quality=92):
    img.save(path, 'WEBP', quality=quality, method=6)
    print('  %-42s %sx%s  %.1f KB' % (os.path.relpath(path, ROOT), img.size[0], img.size[1], os.path.getsize(path) / 1024))


def keyed_out(img, tol=20):
    """Return the artwork with its OUTER background made transparent.

    Flood fill from the borders across near-white pixels only, so whites that are
    enclosed by artwork survive.
    """
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    queue = deque()

    def pale(p):
        return p[0] >= 255 - tol and p[1] >= 255 - tol and p[2] >= 255 - tol

    def push(x, y):
        i = y * w + x
        if not seen[i] and pale(px[x, y]):
            seen[i] = 1
            queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    while queue:
        x, y = queue.popleft()
        if x:
            push(x - 1, y)
        if x < w - 1:
            push(x + 1, y)
        if y:
            push(x, y - 1)
        if y < h - 1:
            push(x, y + 1)

    out = img.convert('RGBA')
    out_px = out.load()
    for i, is_outside in enumerate(seen):
        if is_outside:
            x, y = i % w, i // w
            r, g, b, _ = out_px[x, y]
            out_px[x, y] = (r, g, b, 0)
    return out


def font(name, size):
    path = os.path.join(FONT_DIR, name)
    if not os.path.exists(path):
        raise SystemExit('missing font: %s (set FONT_DIR to the folder holding it)' % path)
    return ImageFont.truetype(path, size)


def tracked(draw, xy, text, fnt, fill, spacing=0.0, anchor_top=True):
    """Draw letter-spaced text. GDI and PIL both lack tracking, so step glyphs."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + spacing
    return x


def tracked_width(draw, text, fnt, spacing=0.0):
    return sum(draw.textlength(ch, font=fnt) for ch in text) + spacing * max(0, len(text) - 1)


# ---------------------------------------------------------------- assets ----
def build_logo_assets():
    src = Image.open(SRC).convert('RGB')
    mark = trim(src.crop(MARK))
    lockup = trim(src.crop(LOCKUP))

    print('mark tile (white square, used inside the brand plates):')
    save_png(fit(pad_square(mark, margin=0.07), 192), os.path.join(IMAGES, 'logo-mark.png'), colours=64)

    print('lockup (natural aspect, for the admin/login card):')
    save_webp(fit(pad(lockup, 0.02), 520), os.path.join(IMAGES, 'logo-lockup.webp'), quality=92)

    print('favicons (outer white keyed out, interior whites kept):')
    icon = keyed_out(fit(pad_square(mark, margin=0.08), 512))
    save_rgba_png(icon, os.path.join(APP, 'icon.png'), colours=64)
    save_rgba_png(icon.resize((180, 180), Image.LANCZOS), os.path.join(APP, 'apple-icon.png'), colours=64)

    return lockup


def build_og(lockup):
    """1200x630 social card: the real lockup, plus the facts a buyer needs."""
    W, H = 1200, 630
    M = 64
    bg = Image.new('RGB', (W, H), WHITE)
    d = ImageDraw.Draw(bg)

    # Control strip along the top, in the inks the UI actually uses.
    for i, ink in enumerate((PRESS_CYAN, TURQUOISE, PRESS_YELLOW, INK_950)):
        d.rectangle([i * (W // 4), 0, (i + 1) * (W // 4) + 1, 12], fill=ink)

    card = fit(lockup, 372)
    bg.paste(card, (M, (H - card.size[1]) // 2 + 6))

    x = 520
    right = W - M

    eyebrow = font('segoeuib.ttf', 19)
    tracked(d, (x, 172), 'COMMERCIAL PRINTING PRESS', eyebrow, TURQUOISE, spacing=3.4)
    d.rectangle([x, 204, x + 42, 208], fill=TURQUOISE)

    head = font('georgiab.ttf', 52)
    d.text((x, 226), 'Saket Metro,', font=head, fill=INK_950)
    d.text((x, 288), 'New Delhi.', font=head, fill=INK_950)

    body = font('segoeui.ttf', 22)
    d.text((x, 372), 'Business cards · Flex banners · T-shirts · Flyers', font=body, fill=INK_500)
    d.text((x, 404), '300 DPI offset and digital · 24-48 hour dispatch', font=body, fill=INK_500)

    pill = font('segoeuib.ttf', 21)
    label = 'Free store pickup  ·  From \u20b91 a card'
    pw = int(tracked_width(d, label, pill)) + 48
    d.rounded_rectangle([x, 452, x + pw, 504], radius=26, fill=TURQUOISE)
    tracked(d, (x + 24, 465), label, pill, WHITE)

    foot = font('segoeuib.ttf', 20)
    d.line([M, 560, right, 560], fill=INK_200, width=2)
    d.text((M, 580), 'printvatika.com', font=foot, fill=INK_950)
    tagline = 'WE PRINT, YOU IMPRESS'
    tw = tracked_width(d, tagline, foot, spacing=3.2)
    tracked(d, (right - tw, 580), tagline, foot, TURQUOISE, spacing=3.2)

    path = os.path.join(ROOT, 'public', 'og.png')
    bg.quantize(colors=192, method=Image.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).convert('RGB').save(path, 'PNG', optimize=True)
    print('  %-42s %sx%s  %.1f KB' % (os.path.relpath(path, ROOT), W, H, os.path.getsize(path) / 1024))


if __name__ == '__main__':
    print('logo.png ->')
    lockup = build_logo_assets()
    print('og card ->')
    build_og(lockup)
