"""将 student image.png 按 5×6 等分网格切分（均匀间距版）。"""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "image" / "student image.png"
OUT_DIR = ROOT / "public" / "image" / "avatars"

COLS = 5
ROWS = 6
BOY_ROWS = [0, 1, 5]
GIRL_ROWS = [2, 3, 4]

# 圆形蒙版内缩 1px，避免边缘锯齿
CIRCLE_INSET = 1


def cell_bounds(width: int, height: int, row: int, col: int) -> tuple[int, int, int, int]:
    left = round(col * width / COLS)
    right = round((col + 1) * width / COLS)
    top = round(row * height / ROWS)
    bottom = round((row + 1) * height / ROWS)
    return left, top, right, bottom


def crop_cell_centered_square(cell: Image.Image) -> Image.Image:
    """在格子中心按短边裁正方形，贴合外圈圆。"""
    width, height = cell.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return cell.crop((left, top, left + side, top + side))


def apply_circular_mask(image: Image.Image) -> Image.Image:
    size = image.size[0]
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    inset = CIRCLE_INSET
    draw.ellipse((inset, inset, size - 1 - inset, size - 1 - inset), fill=255)
    result = image.convert("RGBA")
    result.putalpha(mask)
    return result


def export_avatars(apply_mask: bool = True) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SRC).convert("RGBA")
    width, height = sheet.size

    boy_index = 1
    for row in BOY_ROWS:
        for col in range(COLS):
            box = cell_bounds(width, height, row, col)
            cell = sheet.crop(box)
            cropped = crop_cell_centered_square(cell)
            if apply_mask:
                cropped = apply_circular_mask(cropped)
            cropped.save(OUT_DIR / f"boy-{boy_index:02d}.png")
            boy_index += 1

    girl_index = 1
    for row in GIRL_ROWS:
        for col in range(COLS):
            box = cell_bounds(width, height, row, col)
            cell = sheet.crop(box)
            cropped = crop_cell_centered_square(cell)
            if apply_mask:
                cropped = apply_circular_mask(cropped)
            cropped.save(OUT_DIR / f"girl-{girl_index:02d}.png")
            girl_index += 1

    sample = Image.open(OUT_DIR / "boy-01.png")
    count = len([name for name in os.listdir(OUT_DIR) if name.endswith(".png")])
    print(f"Exported {count} avatars ({sample.size[0]}x{sample.size[1]} each) to {OUT_DIR}")


if __name__ == "__main__":
    export_avatars()
