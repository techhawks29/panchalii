"""Generate saree-style placeholder PNGs for local development (no dependencies)."""
import os
import struct
import sys
import zlib

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
GOLD = (201, 169, 110)
GOLD_DARK = (150, 118, 66)


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(r) for r in rows)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def saree(path, base_hex, w=600, h=800):
    """Body with motif grid, side borders, and a heavy gold pallu band near the bottom."""
    base = hex_rgb(base_hex)
    dark = mix(base, (0, 0, 0), 0.35)
    light = mix(base, (255, 255, 255), 0.12)
    pallu_top, pallu_bot = int(h * 0.70), int(h * 0.90)
    rows = []
    for y in range(h):
        shade = mix(light, dark, y / h)
        row = bytearray()
        in_pallu = pallu_top <= y < pallu_bot
        pallu_edge = abs(y - pallu_top) < 4 or abs(y - pallu_bot) < 4
        for x in range(w):
            side = x < 34 or x >= w - 34
            side_line = x in (40, 41, w - 42, w - 41)
            if pallu_edge or side_line:
                c = GOLD
            elif in_pallu:
                # zig-zag weave inside the pallu
                c = GOLD if ((x + (y - pallu_top) * 2) // 10) % 3 == 0 else GOLD_DARK
            elif side:
                c = GOLD_DARK if (y // 6) % 2 else mix(GOLD_DARK, dark, 0.5)
            else:
                # small diamond motif grid (butis)
                mx, my = (x - 60) % 56, y % 56
                d = abs(mx - 28) + abs(my - 28)
                c = GOLD if d < 5 else (mix(shade, GOLD, 0.25) if d < 7 else shade)
            row += bytes(c)
        rows.append(row)
    write_png(path, w, h, rows)


def banner(path, w=1600, h=900):
    """Dark forest-green hero with diagonal gold drape lines fading to the left."""
    bg_top, bg_bot = hex_rgb('#1E301E'), hex_rgb('#0F1A0F')
    rows = []
    for y in range(h):
        bg = mix(bg_top, bg_bot, y / h)
        row = bytearray()
        for x in range(w):
            fade = max(0.0, (x - w * 0.45) / (w * 0.55))
            stripe = (x + y) % 90
            if fade > 0 and stripe < 3:
                c = mix(bg, GOLD, 0.55 * fade)
            elif fade > 0 and (x * 2 + y) % 140 < 2:
                c = mix(bg, GOLD, 0.3 * fade)
            else:
                c = bg
            row += bytes(c)
        rows.append(row)
    write_png(path, w, h, rows)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    specs = [line.split(':') for line in sys.argv[1:]]
    for name, colour in specs:
        saree(os.path.join(OUT, f'{name}.png'), colour)
    banner(os.path.join(OUT, 'hero.png'))
    print(f'wrote {len(specs) + 1} images to {os.path.normpath(OUT)}')
