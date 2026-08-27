"""Create portable, checkpoint-safe Expo icon assets from the current AI40 master icon."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
SOURCE = ASSETS / "icon.png"
TARGETS = {
    "icon.png": 768,
    "splash-icon.png": 768,
    "android-icon-foreground.png": 768,
    "favicon.png": 256,
}
MAX_BYTES = 950_000


def optimized_image(image: Image.Image, size: int) -> Image.Image:
    rgba = image.convert("RGBA")
    return rgba.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"AI40 master icon is missing: {SOURCE}")

    with Image.open(SOURCE) as source:
        for filename, size in TARGETS.items():
            target = ASSETS / filename
            optimized_image(source, size).save(target, format="PNG", optimize=True, compress_level=9)
            byte_count = target.stat().st_size
            if byte_count > MAX_BYTES:
                raise RuntimeError(f"{target.name} remains too large: {byte_count} bytes")
            print(f"{target.name}: {byte_count} bytes")


if __name__ == "__main__":
    main()
